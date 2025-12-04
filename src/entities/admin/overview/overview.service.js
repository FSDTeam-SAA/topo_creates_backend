import { createPaginationInfo } from "../../../lib/pagination.js";
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


export const topLendersService = async (page, limit) => {

  const lendersAgg = await Payment.aggregate([
    {
      $match: {
        lenderId: { $ne: null },
        type: "booking"
      }
    },
    {
      $group: {
        _id: "$lenderId",
        totalBookings: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [{ $eq: ["$status", "Paid"] }, "$amount", 0]
          }
        },
        pendingOrCancel: {
          $sum: {
            $cond: [{ $ne: ["$status", "Paid"] }, 1, 0]
          }
        }
      }
    },
    { $sort: { revenue: -1 } },

    // Count documents BEFORE pagination
    {
      $facet: {
        data: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "lender"
            }
          },
          { $unwind: "$lender" },
          {
            $project: {
              _id: 0,
              id: "$_id",
              name: "$lender.fullName",
              email: "$lender.email",
              totalBookings: 1,
              revenue: 1,
              pendingOrCancel: 1
            }
          }
        ],
        totalCount: [
          { $count: "count" }
        ]
      }
    }
  ]);

  const lenders = lendersAgg[0].data;
  const total = lendersAgg[0].totalCount[0]?.count || 0;

  return {
    lenders,
    pagination: createPaginationInfo(page, limit, total)
  };
};



export const topDressesService = async (page, limit) => {
  const skip = (page - 1) * limit;

  const aggregationPipeline = [
    {
      $match: {
        type: "booking",
        lenderId: { $ne: null },
        bookingId: { $ne: null }
      }
    },

    // Get booking details
    {
      $lookup: {
        from: "bookings",
        localField: "bookingId",
        foreignField: "_id",
        as: "booking"
      }
    },
    { $unwind: "$booking" },

    // IMPORTANT FIX — match correct field
    {
      $group: {
        _id: {
          masterDressId: "$booking.masterdressId",
          lenderId: "$lenderId"
        },
        totalBookings: { $sum: 1 },
        revenue: {
          $sum: {
            $cond: [{ $eq: ["$status", "Paid"] }, "$amount", 0]
          }
        },
        pendingOrCancel: {
          $sum: {
            $cond: [{ $ne: ["$status", "Paid"] }, 1, 0]
          }
        }
      }
    },

    // 🔥 SORT BY totalBookings (DESCENDING)
    { $sort: { totalBookings: -1 } },

    // Join MasterDress
    {
      $lookup: {
        from: "masterdresses",
        localField: "_id.masterDressId",
        foreignField: "_id",
        as: "dress"
      }
    },
    { $unwind: "$dress" },

    // Join lender
    {
      $lookup: {
        from: "users",
        localField: "_id.lenderId",
        foreignField: "_id",
        as: "lender"
      }
    },
    { $unwind: "$lender" },

    {
      $project: {
        _id: 0,
        masterDressDbId: "$_id.masterDressId",
        masterDressId: "$dress.masterDressId",
        dressName: "$dress.dressName",

        lenderId: "$_id.lenderId",
        lenderName: "$lender.fullName",
        lenderEmail: "$lender.email",

        totalBookings: 1,
        revenue: 1,
        pendingOrCancel: 1
      }
    }
  ];

  // ---------------------
  // COUNT TOTAL (WITHOUT PAGINATION)
  // ---------------------
  const totalDataAgg = await Payment.aggregate([...aggregationPipeline]);
  const totalData = totalDataAgg.length;

  // ---------------------
  // APPLY PAGINATION
  // ---------------------
  const paginatedData = await Payment.aggregate([
    ...aggregationPipeline,
    { $skip: skip },
    { $limit: limit }
  ]);

  // Pagination object
  const paginationInfo = createPaginationInfo(page, limit, totalData);

  return {
    results: paginatedData,
    paginationInfo
  };
};
