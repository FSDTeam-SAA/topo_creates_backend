import User from "../../auth/auth.model.js";
import { Booking } from "../../booking/booking.model.js";
import { Dispute } from "../../dispute/dispute.model.js";
import Payment from "../../Payment/Booking/payment.model.js";


export const getAdminDashboardStatsService = async (startDate, endDate) => {
  const now = new Date();

  // ----------------------------
  // ✔ DATE FILTER BUILDER
  // ----------------------------
  let dateFilter = {};

  if (startDate && endDate) {
    dateFilter.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate + "T23:59:59.999")
    };
  }

  // ----------------------------
  // BOOKING VOLUME
  // ----------------------------

  const activeBookings = await Booking.countDocuments({
    rentalStartDate: { $lte: now },
    rentalEndDate: { $gte: now },
    ...dateFilter
  });

  const completedPayments = await Payment.countDocuments({
    status: "Paid",
    type: "booking",
    ...dateFilter
  });

  const cancelledOrPending = await Booking.countDocuments({
    status: { $nin: ["Paid"] },
    ...dateFilter
  });

  const pendingDisputes = await Dispute.countDocuments({
    status: "Pending",
    ...dateFilter
  });

  const escalatedDisputes = await Dispute.countDocuments({
    $or: [
      { status: "Escalated" },
      { isEscalated: true }
    ],
    ...dateFilter
  });

  const resolvedDisputes = await Dispute.countDocuments({
    status: { $in: ["Resolved", "Closed"] },
    ...dateFilter
  });


  const revenueAgg = await Payment.aggregate([
    { $match: { status: "Paid", type: "booking", ...dateFilter } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const totalRevenue = revenueAgg[0]?.total || 0;

  const activeLenders = await User.countDocuments({
    role: "LENDER",
    isActive: true,
    ...dateFilter
  });

  return {
    dateRange: { startDate, endDate },

    totalRevenue,
    activeLenders,

    activeBookings,      
    pendingDisputes,     

    bookingVolume: {
      active: activeBookings,
      completed: completedPayments,
      cancelledOrPending
    },

    disputeResolution: {
      pending: pendingDisputes,
      escalated: escalatedDisputes,
      resolved: resolvedDisputes
    }
  };
};


export const getRevenueTrendsService = async (year) => {
  const selectedYear = year ? parseInt(year) : new Date().getFullYear();

  const startOfYear = new Date(selectedYear, 0, 1);  
  const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59, 999); 

  const revenueAgg = await Payment.aggregate([
    {
      $match: {
        status: "Paid",
        type: "booking",
        createdAt: { $gte: startOfYear, $lte: endOfYear }
      }
    },
    {
      $group: {
        _id: { month: { $month: "$createdAt" } },
        total: { $sum: "$amount" }
      }
    },
    { $sort: { "_id.month": 1 } }
  ]);

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const fullYearData = monthNames.map((name, index) => {
    const monthData = revenueAgg.find(m => m._id.month === index + 1);
    return {
      month: name,
      value: monthData ? monthData.total : 0
    };
  });

  return {
    year: selectedYear,
    revenueTrends: fullYearData
  };
};




