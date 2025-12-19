import mongoose from "mongoose";
import payOutModel from "../../lender/payOut/payOut.model.js";
import Payment from "../../Payment/Booking/payment.model.js";
const Booking = mongoose.model("Booking");
const User = mongoose.model("User");

export const getBookingFinanceStatsController = async (req, res) => {
  try {
    const result = await payOutModel.aggregate([
      // 1️⃣ Add revenue field and yearMonth
      {
        $addFields: {
          revenue: {
            $cond: [
              { $eq: ["$status", "paid"] },
              {
                $add: [
                  { $subtract: ["$bookingAmount", "$lenderPrice"] },
                  { $multiply: ["$lenderPrice", { $divide: ["$commission", 100] }] }
                ]
              },
              0
            ]
          },
          yearMonth: { $dateToString: { format: "%Y-%m", date: "$requestedAt" } }
        }
      },

      // 2️⃣ Group by month
      {
        $group: {
          _id: "$yearMonth",
          monthlyRevenue: { $sum: "$revenue" }, // only paid bookings counted in revenue
          totalBookingAmountAll: { $sum: "$bookingAmount" }, // all bookings for AOV
          totalOrdersAll: { $sum: 1 }, // total bookings count (paid + unpaid)
          totalPaidOrders: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] }
          },
          totalProfit: { $sum: "$revenue" } // same as monthlyRevenue
        }
      },

      { $sort: { _id: 1 } }
    ]);

    // 3️⃣ Calculate MoM % change and averages
    let prevRevenue = null;
    let totalBookingRevenue = 0; // total revenue across all months
    result.forEach((month) => {
      // Average Order Value (all bookings)
      month.avgOrderValue = month.totalBookingAmountAll / month.totalOrdersAll;

      // Average Profit per Order (paid bookings only)
      month.avgProfitPerOrder = month.totalPaidOrders
        ? month.totalProfit / month.totalPaidOrders
     : 0;

      // MoM % change (revenue of paid bookings)
      if (prevRevenue !== null) {
        month.momChange = ((month.monthlyRevenue - prevRevenue) / prevRevenue) * 100;
      } else {
        month.momChange = null; // first month
      }

      prevRevenue = month.monthlyRevenue;
      totalBookingRevenue += month.monthlyRevenue;
    });

    return res.status(200).json({
      status: true,
      message: "Booking statistics retrieved successfully",
      totalBookingRevenue,
      data: result
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



// export const subscriptionAnalytics = async (req, res) => {
//   try {
//     const { fromDate, toDate } = req.query;

//     const dateFilter = {};
//     if (fromDate) dateFilter.$gte = new Date(fromDate);
//     if (toDate) dateFilter.$lte = new Date(toDate);

//     const query = {};
//     if (fromDate || toDate) query.createdAt = dateFilter;

//     // Fetch subscriptions with customer populated
//   const subscriptions = await Payment.find(query)
//   .populate("customerId") // full user object
//   .populate({
//     path: "subscription.planId",
//     model: "SubscriptionPlan",
//     select: "name price durationDays",
//   })
//   .sort({ createdAt: -1 });

//     // Initialize arrays and counters
//     const newSignUps = [];
//     const churnedUsers = [];
//     const activeSubscribers = [];
//     let totalMRR = 0;

//     // MRR trend
//     const mrrTrendMap = {};

//     subscriptions.forEach((sub) => {
//       const customer = sub.customerId;
//       const name = customer ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() : "";

//       const paidAmount = Number(sub.amount) || 0;

//       // MRR trend per month
//       const yearMonth = sub.createdAt.toISOString().slice(0, 7); // YYYY-MM
//       if (!mrrTrendMap[yearMonth]) mrrTrendMap[yearMonth] = 0;
//       if (sub.status === "Paid") mrrTrendMap[yearMonth] += paidAmount;

//       // Total MRR
//       if (sub.status === "Paid") totalMRR += paidAmount;

//      // ✅ Get subscription info from user model
//   const subscriptionStart = customer?.subscription?.subscriptionStartDate || sub.createdAt;
//   const subscriptionEnd = customer?.subscription?.subscriptionExpireDate || null;
//   const planId = customer?.subscription?.planId?._id;
//   const planName = customer?.subscription?.planId?.name || "N/A";

//       // Prepare subscription object
//       const subData = {
//         _id: sub._id,
//         customerId: customer?._id,
//         name,
        
//         subscriptionStart,
//         subscriptionEnd,
//         amount: paidAmount,
//         status: sub.status,
//       };

//       // Categorize
//       if (sub.status === "Paid") newSignUps.push(subData);
//       if (sub.status === "Cancelled") churnedUsers.push(subData);
//       if (sub.status === "Paid" || sub.status === "Active") activeSubscribers.push(subData);
//     });

//     // Convert MRR trend map to array sorted by month
//     const mrrTrend = Object.keys(mrrTrendMap)
//       .sort()
//       .map((month) => ({
//         month,
//         mrr: mrrTrendMap[month],
//       }));

//     return res.status(200).json({
//       success: true,
//       totalMRR,
//       totalNewSignUps: newSignUps.length,
//       totalActiveSubscribers: activeSubscribers.length,
//       totalCancelledSubscribers: churnedUsers.length,
//       mrrTrend,
//       newSignUps,
//       churnedUsers,
//       activeSubscribers,
//     });
//   } catch (err) {
//     console.error("❌ Error fetching subscription analytics:", err);
//     return res.status(500).json({
//       success: false,
//       message: "Server Error",
//       error: err.message,
//     });
//   }
// };


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