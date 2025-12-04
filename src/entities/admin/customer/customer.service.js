import mongoose from "mongoose";
import User from "../../auth/auth.model.js";
import { Booking } from "../../booking/booking.model.js";
import Payment from "../../Payment/Booking/payment.model.js";
import { Dispute } from "../../dispute/dispute.model.js";
import { createPaginationInfo } from "../../../lib/pagination.js";


export const getCustomerStatsService = async () => {
  const totalCustomers = await User.countDocuments({ role: "USER" });

  const totalBookings = await Booking.countDocuments();

  return {
    totalCustomers,
    totalBookings
  };
};


export const getAllCustomersService = async (query) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    startDate,
    endDate
  } = query;

  const skip = (page - 1) * limit;

  const filter = { role: "USER" };

  // Search by name or email
  if (search) {
    filter.$or = [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } }
    ];
  }

  // Date filter
  if (startDate || endDate) {
    filter.createdAt = {};

    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const customers = await User.find(filter)
    .select("firstName lastName email createdAt")
    .skip(skip)
    .limit(Number(limit))
    .lean();

  // Attach totalBookings + totalSpent
  const result = await Promise.all(
    customers.map(async (customer) => {
      const customerId = customer._id;

      const totalBookings = await Booking.countDocuments({ customer: customerId });

      const payments = await Payment.aggregate([
        { $match: { customerId: new mongoose.Types.ObjectId(customerId), status: "Paid" } },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: "$amount" }
          }
        }
      ]);

      const totalSpent = payments.length > 0 ? payments[0].totalSpent : 0;

      return {
        ...customer,
        totalBookings,
        totalSpent
      };
    })
  );

  const total = await User.countDocuments(filter);

  const pagination = createPaginationInfo(Number(page), Number(limit), total);

  return {
    customers: result,
    pagination
  };
};


export const getCustomerByIdService = async (customerId) => {
  if (!mongoose.Types.ObjectId.isValid(customerId)) {
    throw new Error("Invalid customer ID");
  }

  // ===== CUSTOMER PROFILE =====
  const customer = await User.findById(customerId)
    .select(
      "firstName lastName email phoneNumber createdAt address status kycStatus kycVerified kycDetails"
    )
    .lean();

  if (!customer) throw new Error("Customer not found");

  // ===== STATS =====
  const totalBookings = await Booking.countDocuments({ customer: customerId });

  const paymentData = await Payment.aggregate([
    { $match: { customerId: new mongoose.Types.ObjectId(customerId), status: "Paid" } },
    { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
  ]);

  const totalSpent = paymentData.length > 0 ? paymentData[0].totalSpent : 0;

  // ===== FULL BOOKING HISTORY (NO PAGINATION) =====
  const bookings = await Booking.find({ customer: customerId })
    .populate("masterdressId", "dressName thumbnail")
    .populate("lender", "fullName email")
    .select(
      "rentalStartDate rentalEndDate rentalFee totalAmount status paymentStatus allocatedLender.lenderId masterdressId createdAt"
    )
    .sort({ createdAt: -1 })
    .lean();

  const bookingHistory = bookings.map((b) => ({
    bookingId: b._id,
    dressName: b.masterdressId?.dressName,
    thumbnail: b.masterdressId?.thumbnail,
    lenderId: b.allocatedLender?.lenderId,
    lenderName: b.allocatedLender?.lenderName,
    status: b.paymentStatus,
    price: b.totalAmount,
    start: b.rentalStartDate,
    end: b.rentalEndDate,
    bookedAt: b.createdAt,
  }));

  // ===== FULL DISPUTE LIST (NO PAGINATION) =====
  const disputes = await Dispute.find({ createdBy: customerId })
    .populate("booking", "masterdressId rentalStartDate rentalEndDate")
    .select("booking issueType status createdAt")
    .sort({ createdAt: -1 })
    .lean();

  const customerDisputes = disputes.map((d) => ({
    disputeId: d._id,
    bookingId: d.booking?._id,
    issueType: d.issueType,
    status: d.status,
    createdAt: d.createdAt,
  }));

  // ===== FULL TIMELINE =====
  const allBookings = await Booking.find({ customer: customerId })
    .select("_id createdAt paymentStatus")
    .lean();

  const allDisputes = await Dispute.find({ createdBy: customerId })
    .select("booking createdAt")
    .lean();

  const disputeMap = {};
  allDisputes.forEach((d) => {
    disputeMap[d.booking.toString()] = {
      disputeId: d._id,
      disputeCreatedAt: d.createdAt,
    };
  });

  const combinedTimeline = allBookings
    .map((b) => ({
      bookingId: b._id,
      bookingCreatedAt: b.createdAt,
      bookingStatus: b.paymentStatus || "Pending",
      disputeId: disputeMap[b._id]?.disputeId || null,
      disputeCreatedAt: disputeMap[b._id]?.disputeCreatedAt || null,
    }))
    .sort((a, b) => new Date(b.bookingCreatedAt) - new Date(a.bookingCreatedAt));

  // ===== FINAL RESPONSE =====
  return {
    customerProfile: {
      ...customer,
      totalBookings,
      totalSpent,
    },

    bookingHistory: bookingHistory,     
    customerDisputes: customerDisputes, 
    timeline: combinedTimeline,        
  };
};



// export const getCustomerByIdService = async (customerId, page, limit) => {
//   if (!mongoose.Types.ObjectId.isValid(customerId)) {
//     throw new Error("Invalid customer ID");
//   }

//   const skip = (page - 1) * limit;

//   // ===== CUSTOMER PROFILE =====
//   const customer = await User.findById(customerId)
//     .select(
//       "firstName lastName email phoneNumber createdAt address status kycStatus kycVerified kycDetails"
//     )
//     .lean();

//   if (!customer) throw new Error("Customer not found");

//   // ===== STATS =====
//   const totalBookings = await Booking.countDocuments({ customer: customerId });

//   const paymentData = await Payment.aggregate([
//     { $match: { customerId: new mongoose.Types.ObjectId(customerId), status: "Paid" } },
//     { $group: { _id: null, totalSpent: { $sum: "$amount" } } },
//   ]);

//   const totalSpent = paymentData.length > 0 ? paymentData[0].totalSpent : 0;

//   // ===== PAGINATED BOOKING HISTORY =====
//   const [bookings, bookingTotal] = await Promise.all([
//     Booking.find({ customer: customerId })
//       .populate("masterdressId", "dressName thumbnail")
//       .populate("lender", "fullName email")
//       .select(
//         "rentalStartDate rentalEndDate rentalFee totalAmount status paymentStatus allocatedLender.lenderId masterdressId createdAt"
//       )
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .lean(),

//     Booking.countDocuments({ customer: customerId }),
//   ]);

//   const bookingHistory = bookings.map((b) => ({
//     bookingId: b._id,
//     dressName: b.masterdressId?.dressName,
//     thumbnail: b.masterdressId?.thumbnail,
//     lenderId: b.allocatedLender?.lenderId,
//     lenderName: b.allocatedLender?.lenderName,
//     status: b.paymentStatus,
//     price: b.totalAmount,
//     start: b.rentalStartDate,
//     end: b.rentalEndDate,
//     bookedAt: b.createdAt,
//   }));

//   // ===== PAGINATED DISPUTES =====
//   const [disputes, disputeTotal] = await Promise.all([
//     Dispute.find({ createdBy: customerId })
//       .populate("booking", "masterdressId rentalStartDate rentalEndDate")
//       .select("booking issueType status createdAt")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .lean(),

//     Dispute.countDocuments({ createdBy: customerId }),
//   ]);

//   const customerDisputes = disputes.map((d) => ({
//     disputeId: d._id,
//     bookingId: d.booking?._id,
//     issueType: d.issueType,
//     status: d.status,
//     createdAt: d.createdAt,
//   }));

//   // ===== TIMELINE (combined bookings + disputes) =====
//   const timelineRaw = await Promise.all([
//     // All bookings (no pagination, timeline needs full collection but will paginate later)
//     Booking.find({ customer: customerId })
//       .select("_id createdAt paymentStatus")
//       .lean(),

//     // All disputes
//     Dispute.find({ createdBy: customerId })
//       .select("booking createdAt")
//       .lean(),
//   ]);

//   const [allBookings, allDisputes] = timelineRaw;

//   // Convert to hash map for quick lookup
//   const disputeMap = {};
//   allDisputes.forEach((d) => {
//     disputeMap[d.booking.toString()] = {
//       disputeId: d._id,
//       disputeCreatedAt: d.createdAt,
//     };
//   });

//   const combinedTimeline = allBookings.map((b) => ({
//     bookingId: b._id,
//     bookingCreatedAt: b.createdAt,
//     bookingStatus: b.paymentStatus || "Pending",
//     disputeId: disputeMap[b._id]?.disputeId || null,
//     disputeCreatedAt: disputeMap[b._id]?.disputeCreatedAt || null,
//   }));

//   // Sort timeline DESC
//   combinedTimeline.sort((a, b) => new Date(b.bookingCreatedAt) - new Date(a.bookingCreatedAt));

//   // Timeline pagination
//   const timelineTotal = combinedTimeline.length;
//   const timelinePaginated = combinedTimeline.slice(skip, skip + limit);

//   return {
//     customerProfile: {
//       ...customer,
//       totalBookings,
//       totalSpent,
//     },

//     bookingHistory: {
//       data: bookingHistory,
//       paginationInfo: createPaginationInfo(page, limit, bookingTotal),
//     },

//     customerDisputes: {
//       data: customerDisputes,
//       paginationInfo: createPaginationInfo(page, limit, disputeTotal),
//     },

//     timeline: {
//       data: timelinePaginated,
//       paginationInfo: createPaginationInfo(page, limit, timelineTotal),
//     },
//   };
// };


