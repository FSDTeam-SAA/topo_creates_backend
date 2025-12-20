import mongoose from "mongoose";
import payOutModel from "../../lender/payOut/payOut.model.js";
import Payment from "../../Payment/Booking/payment.model.js";
const Booking = mongoose.model("Booking");
const User = mongoose.model("User");

export const getBookingFinanceStatsController = async (req, res) => {
  try {
    const monthlyStats = await payOutModel.aggregate([
      // 1️⃣ Add revenue & yearMonth
      {
        $addFields: {
          revenue: {
            $cond: [
              { $eq: ["$status", "paid"] },
              {
                $add: [
                  { $subtract: ["$bookingAmount", "$lenderPrice"] },
                  {
                    $multiply: [
                      "$lenderPrice",
                      { $divide: ["$commission", 100] }
                    ]
                  }
                ]
              },
              0
            ]
          },
          yearMonth: {
            $dateToString: { format: "%Y-%m", date: "$requestedAt" }
          }
        }
      },

      // 2️⃣ Group by month
      {
        $group: {
          _id: "$yearMonth",
          monthlyRevenue: { $sum: "$revenue" },

          totalBookingAmountAll: { $sum: "$bookingAmount" },
          totalOrdersAll: { $sum: 1 },

          totalPaidOrders: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] }
          },

          totalProfit: { $sum: "$revenue" }
        }
      },

      { $sort: { _id: 1 } }
    ]);

    // 3️⃣ Monthly MoM + global accumulators
    let prevRevenue = null;

    let globalRevenue = 0;
    let globalBookingAmount = 0;
    let globalOrders = 0;
    let globalPaidOrders = 0;

    const monthly = monthlyStats.map((m) => {
      const momChange =
        prevRevenue !== null && prevRevenue > 0
          ? ((m.monthlyRevenue - prevRevenue) / prevRevenue) * 100
          : null;

      prevRevenue = m.monthlyRevenue;

      globalRevenue += m.monthlyRevenue;
      globalBookingAmount += m.totalBookingAmountAll;
      globalOrders += m.totalOrdersAll;
      globalPaidOrders += m.totalPaidOrders;

      return {
        month: m._id,
        revenue: m.monthlyRevenue,
        momChange
      };
    });

    // 4️⃣ Global KPIs (top cards)
    const summary = {
      totalBookingRevenue: globalRevenue,

      averageOrderValue: globalOrders
        ? globalBookingAmount / globalOrders
        : 0,

      averageProfitPerOrder: globalPaidOrders
        ? globalRevenue / globalPaidOrders
        : 0,

      momChange:
        monthly.length >= 2 &&
        monthly[monthly.length - 2].revenue > 0
          ? (
              ((monthly[monthly.length - 1].revenue -
                monthly[monthly.length - 2].revenue) /
                monthly[monthly.length - 2].revenue) *
              100
            )
          : null
    };

    return res.status(200).json({
      status: true,
      message: "Booking statistics retrieved successfully",
      summary,
      monthly
    });
  } catch (err) {
    console.error("❌ Error getting booking stats:", err);
    return res.status(500).json({
      status: false,
      message: "Server Error",
      error: err.message
    });
  }
};





export const lenderPayoutStats = async (req, res) => {
  try {
    // ==============================
    // 1️⃣ Parse query params
    // ==============================
    const { search, fromDate, toDate, status, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const pageSize = parseInt(limit);

    // ==============================
    // 2️⃣ Build query filters
    // ==============================
    const query = {};

    // Date filter
    if (fromDate || toDate) {
      query.requestedAt = {};
      if (fromDate) query.requestedAt.$gte = new Date(fromDate);
      if (toDate) query.requestedAt.$lte = new Date(toDate);
    }

    // Status filter
    if (status && ["paid", "pending"].includes(status.toLowerCase())) {
      query.status = status.toLowerCase();
    }

    // Search by lenderId, name, or email
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      }).select("_id");

      const lenderIds = users.map((u) => u._id.toString());
      query.$or = [
        { lenderId: { $in: lenderIds } },
        { lenderId: { $regex: search, $options: "i" } } // direct ID search
      ];
    }

    // ==============================
    // 3️⃣ Fetch payouts with lender info
    // ==============================
    const payouts = await payOutModel
      .find(query)
      .populate("lenderId", "firstName lastName email")
      .sort({ requestedAt: -1 });

    // ==============================
    // 4️⃣ Calculate per-lender stats
    // ==============================
    const perLenderMap = {};

    payouts.forEach((p) => {
      const lenderId = p.lenderId._id.toString();

      if (!perLenderMap[lenderId]) {
        perLenderMap[lenderId] = {
          _id: lenderId,
          name: p.lenderId.firstName,
          email: p.lenderId.email,
          totalRevenue: 0,
          totalPaid: 0,
          pendingPayout: 0,
          avgPayout: 0,
          totalRequests: 0
        };
      }

      const revenue = (p.bookingAmount - p.lenderPrice) + (p.adminsProfit || 0);
      perLenderMap[lenderId].totalRevenue += revenue;

      if (p.status === "paid") perLenderMap[lenderId].totalPaid += p.requestedAmount;
      if (p.status === "pending") perLenderMap[lenderId].pendingPayout += p.requestedAmount;

      perLenderMap[lenderId].avgPayout += p.requestedAmount;
      perLenderMap[lenderId].totalRequests += 1;
    });

    const perLender = Object.values(perLenderMap).map((lender) => {
      lender.avgPayout = lender.totalRequests ? lender.avgPayout / lender.totalRequests : 0;
      return lender;
    });

    // ==============================
    // 5️⃣ Apply sorting and pagination
    // ==============================
    perLender.sort((a, b) => b.totalRevenue - a.totalRevenue);
    const totalCount = perLender.length;
    const paginated = perLender.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    // ==============================
    // 6️⃣ Calculate global stats
    // ==============================
    const globalStats = {
      totalRevenue: 0,
      totalPaid: 0,
      totalPending: 0,
      avgPayout: 0
    };

    if (payouts.length) {
      payouts.forEach((p) => {
        const revenue = (p.bookingAmount - p.lenderPrice) + (p.adminsProfit || 0);
        globalStats.totalRevenue += revenue;
        if (p.status === "paid") globalStats.totalPaid += p.requestedAmount;
        if (p.status === "pending") globalStats.totalPending += p.requestedAmount;
        globalStats.avgPayout += p.requestedAmount;
      });
      globalStats.avgPayout = payouts.length ? globalStats.avgPayout / payouts.length : 0;
    }

    // ==============================
    // 7️⃣ Return structured response
    // ==============================
    return res.status(200).json({
      success: true,
      totalCount,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCount / pageSize),
      itemsPerPage: pageSize,
      perLender: paginated,
      global: globalStats
    });

  } catch (error) {
    console.error("❌ Error fetching lender payout stats:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};





export const subscriptionAnalytics = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;

    const dateFilter = {};
    if (fromDate) dateFilter.$gte = new Date(fromDate);
    if (toDate) dateFilter.$lte = new Date(toDate);

    const query = { type: "subscription" }; // Filter by type as per your JSON
    if (fromDate || toDate) query.createdAt = dateFilter;

    // Fetch payments and deeply populate the plan inside the customer object
    const subscriptions = await Payment.find(query)
      .populate({
        path: "customerId",
        populate: {
          path: "subscription.planId",
          model: "SubscriptionPlan",
          select: "name price durationDays",
        },
      })
      .sort({ createdAt: -1 });

    const newSignUps = [];
    const churnedUsers = [];
    const activeSubscribers = [];
    let totalMRR = 0;
    const mrrTrendMap = {};

    subscriptions.forEach((sub) => {
      const customer = sub.customerId;
      
      // Use fullName from JSON, fallback to first/last if needed
      const name = customer?.fullName || 
                   `${customer?.firstName || ""} ${customer?.lastName || ""}`.trim() || 
                   "Unknown User";

      const paidAmount = Number(sub.amount) || 0;

      // MRR logic
      const yearMonth = sub.createdAt.toISOString().slice(0, 7);
      if (!mrrTrendMap[yearMonth]) mrrTrendMap[yearMonth] = 0;
      
      if (sub.status === "Paid") {
        mrrTrendMap[yearMonth] += paidAmount;
        totalMRR += paidAmount;
      }

      // Map subscription info from the Customer/User model
      const subStart = customer?.subscriptionStartDate || sub.createdAt;
      const subEnd = customer?.subscriptionExpireDate || null;
      const planName = customer?.subscription?.planId?.name || "N/A";

      const subData = {
        _id: sub._id,
        customerId: customer?._id,
        name,
        planName,
        subscriptionStart: subStart,
        subscriptionEnd: subEnd,
        amount: paidAmount,
        status: sub.status,
      };

      // Categorize based on Payment Status
      if (sub.status === "Paid") newSignUps.push(subData);
      if (sub.status === "Cancelled") churnedUsers.push(subData);
      
      // Use User's 'hasActiveSubscription' flag or Payment status for active list
      if (sub.status === "Paid" || customer?.hasActiveSubscription) {
          activeSubscribers.push(subData);
      }
    });

    const mrrTrend = Object.keys(mrrTrendMap)
      .sort()
      .map((month) => ({
        month,
        mrr: mrrTrendMap[month],
      }));

    return res.status(200).json({
      success: true,
      totalMRR,
      totalNewSignUps: newSignUps.length,
      totalActiveSubscribers: activeSubscribers.length,
      totalCancelledSubscribers: churnedUsers.length,
      mrrTrend,
      newSignUps,
      churnedUsers,
      activeSubscribers,
    });
  } catch (err) {
    console.error("❌ Error fetching subscription analytics:", err);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};