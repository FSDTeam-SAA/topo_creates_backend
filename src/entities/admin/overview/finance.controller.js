import mongoose from "mongoose";
import payOutModel from "../../lender/payOut/payOut.model.js";
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



/**
 * @desc    Get all payout requests with full lender & booking info
 * @route   GET /api/admin/payouts
 * @access  Admin
 */
export const getAllPayoutsController = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const pipeline = [
      // Lookup Booking info
      { $lookup: { from: "bookings", localField: "bookingId", foreignField: "_id", as: "booking" } },
      { $unwind: "$booking" },

      // Lookup Lender info
      { $lookup: { from: "users", localField: "lenderId", foreignField: "_id", as: "lender" } },
      { $unwind: "$lender" },
    ];

    // Search
    if (search) {
      const objectIdSearch = mongoose.Types.ObjectId.isValid(search)
        ? new mongoose.Types.ObjectId(search)
        : null;

      pipeline.push({
        $match: {
          $or: [
            { _id: objectIdSearch },
            { bookingId: objectIdSearch },
            { lenderId: objectIdSearch },
            { status: { $regex: search, $options: "i" } },
            { "lender.name": { $regex: search, $options: "i" } },
            { "lender.email": { $regex: search, $options: "i" } },
            { "booking.bookingAmount": isNaN(search) ? -1 : parseFloat(search) },
          ],
        },
      });
    }

    // Count total after search
    const totalCountPipeline = [...pipeline, { $count: "count" }];
    const totalCountResult = await payOutModel.aggregate(totalCountPipeline);
    const totalCount = totalCountResult[0]?.count || 0;

    // Sort, skip, limit
    pipeline.push({ $sort: { requestedAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const payouts = await payOutModel.aggregate(pipeline);

    // Global stats
    let globalTotalRequested = 0;
    let globalTotalPaid = 0;
    let globalTotalPending = 0;

    // Per-lender stats
    const lenderStats = {};

    payouts.forEach((p) => {
      globalTotalRequested += p.requestedAmount;
      if (p.status === "paid") globalTotalPaid += p.requestedAmount;
      if (p.status === "pending") globalTotalPending += p.requestedAmount;

      const lenderId = p.lender._id.toString();
      if (!lenderStats[lenderId]) {
        lenderStats[lenderId] = {
          lenderId: p.lender._id,
          lenderName: p.lender.name,
          lenderEmail: p.lender.email,
          totalRequestedAmount: 0,
          totalPaidAmount: 0,
          totalPendingAmount: 0,
          totalRevenue: 0, // bookingAmount - requestedAmount
        };
      }

      lenderStats[lenderId].totalRequestedAmount += p.requestedAmount;
      if (p.status === "paid") lenderStats[lenderId].totalPaidAmount += p.requestedAmount;
      if (p.status === "pending") lenderStats[lenderId].totalPendingAmount += p.requestedAmount;
      lenderStats[lenderId].totalRevenue += p.booking.bookingAmount - p.requestedAmount;
    });

    const avgRequestedAmount = payouts.length ? globalTotalRequested / payouts.length : 0;

    return res.status(200).json({
      status: true,
      message: "All payout requests retrieved successfully",
      summary: {
        totalCount,
        page,
        limit,
        globalTotalRequested,
        globalTotalPaid,
        globalTotalPending,
        avgRequestedAmount,
      },
      data: payouts,
      lenderStats: Object.values(lenderStats),
    });
  } catch (err) {
    console.error("❌ Error fetching payout requests:", err);
    return res.status(500).json({
      status: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

