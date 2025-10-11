import mongoose from "mongoose";
import { Booking } from "../../booking/booking.model.js";
import { Dispute } from "../dispute.model.js";


export const createDisputeByLenderService = async (lenderId, bookingId, disputeData) => {
  const booking = await Booking.findOne({ _id: bookingId, lender: lenderId });

  if (!booking) {
    const err = new Error("Booking not found or not owned by lender");
    err.statusCode = 404;
    throw err;
  }

  const dispute = new Dispute({
    booking: bookingId,
    createdBy: lenderId,
    ...disputeData,
    status: "Pending",
    timeline: [
      {
        actor: lenderId,
        role: "LENDER",
        message: `Issue reported: '${disputeData.issueType}'`,
        attachments: disputeData.evidence || [],
      },
    ],
  });

  const savedDispute = await dispute.save();

  booking.dispute = savedDispute._id;
  await booking.save();

  return savedDispute;
};


export const getLenderDisputesService = async (lenderId, page = 1, limit = 10, status, monthFilter) => {
  const skip = (page - 1) * limit;

  // Get all booking IDs owned by this lender
  const bookings = await Booking.find({ lender: lenderId }).select("_id").lean();
  const bookingIds = bookings.map(b => b._id);

  // Build base query
  const query = {
    $or: [
      { createdBy: lenderId },
      { booking: { $in: bookingIds } },
    ],
  };

  // Apply status filter if provided
  if (status) query.status = status;

  // Apply month filter if provided
  if (monthFilter === "current" || monthFilter === "previous") {
    const now = new Date();
    let startDate, endDate;

    if (monthFilter === "current") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (monthFilter === "previous") {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    }

    query.createdAt = { $gte: startDate, $lte: endDate };
  }

  // Fetch disputes + static counts in parallel
  const [disputes, total, resolvedCount, pendingCount] = await Promise.all([
    Dispute.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "booking",
        select: "listing deliveryMethod deliveryStatus customer lender",
        populate: [
          { path: "listing", select: "title dressId" },
          { path: "customer", select: "firstName lastName email profileImage" },
        ],
      })
      .populate({
        path: "createdBy",
        select: "firstName lastName email profileImage",
      })
      .lean(),

    Dispute.countDocuments(query),

    Dispute.countDocuments({
      $or: [
        { createdBy: lenderId },
        { booking: { $in: bookingIds } },
      ],
      status: "Resolved",
      ...(monthFilter === "current" || monthFilter === "previous" ? { createdAt: query.createdAt } : {}),
    }),

    Dispute.countDocuments({
      $or: [
        { createdBy: lenderId },
        { booking: { $in: bookingIds } },
      ],
      status: "Pending",
      ...(monthFilter === "current" || monthFilter === "previous" ? { createdAt: query.createdAt } : {}),
    }),
  ]);

  // Calculate resolution rate
  const resolutionRate = total > 0 ? ((resolvedCount / total) * 100).toFixed(2) : "0.00";

  // Return full response
  return {
    stats: {
      totalDisputes: total,
      resolvedDisputes: resolvedCount,
      pendingDisputes: pendingCount,
      resolutionRate: `${resolutionRate}%`,
    },
    disputes,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};


export const getLenderDisputeByIdService = async (lenderId, disputeId) => {
  if (!mongoose.Types.ObjectId.isValid(disputeId)) {
    const err = new Error("Invalid dispute ID");
    err.statusCode = 400;
    throw err;
  }

  const dispute = await Dispute.findOne({ _id: disputeId, createdBy: lenderId })
    .populate({
      path: "booking",
      select: "listing customer deliveryMethod status orderDate",
      populate: [
        {
          path: "listing",
          select: "dressId dressName brand media rentalPrice"
        },
        {
          path: "customer",
          select: "firstName"
        }
      ]
    })
    .populate("createdBy", "fullName") 
    .lean();

  if (!dispute) {
    const err = new Error("Dispute not found or access denied");
    err.statusCode = 404;
    throw err;
  }

  return dispute;
};


export const escalateDisputeByLenderService = async (
  lenderId,
  disputeId,
  {
    reason,
    description,
    priority,
    confirmed,
    scheduleCall,
    evidence = []
  }
) => {
  if (!mongoose.Types.ObjectId.isValid(disputeId)) {
    const err = new Error("Invalid dispute ID");
    err.statusCode = 400;
    throw err;
  }

  // Fetch dispute + its linked booking
  const dispute = await Dispute.findById(disputeId).populate("booking");

  if (!dispute) {
    const err = new Error("Dispute not found");
    err.statusCode = 404;
    throw err;
  }

  // Ensure lender is linked to the booking
  if (dispute.booking.lender.toString() !== lenderId.toString()) {
    const err = new Error("Access denied: You are not the lender of this booking");
    err.statusCode = 403;
    throw err;
  }

  // Ensure valid dispute status
  if (dispute.status === "Resolved") {
    const err = new Error("Cannot escalate a resolved dispute");
    err.statusCode = 400;
    throw err;
  }

  if (dispute.isEscalated) {
    const err = new Error("Dispute already escalated");
    err.statusCode = 400;
    throw err;
  }

  // Update escalation info
  dispute.isEscalated = true;
  dispute.escalationReason = reason;
  dispute.escalationDescription = description;
  dispute.escalationPriority = priority;
  dispute.escalationConfirmed = confirmed;
  dispute.escalationScheduleCall = !!scheduleCall;
  dispute.escalationEvidence = evidence;
  dispute.escalatedAt = new Date();
  dispute.status = "Escalated";

  // Add timeline entry
  dispute.timeline.push({
    actor: lenderId,
    role: "LENDER",
    message: `Dispute escalated with priority "${priority}": ${reason}`,
    attachments: evidence,
    type: "escalation"
  });

  await dispute.save();

  return dispute;
};







export const replyToSupportByLenderService = async (lenderId, disputeId, message, attachments) => {
  const dispute = await Dispute.findOne({ _id: disputeId, createdBy: lenderId });

  if (!dispute) {
    const err = new Error("Dispute not found or not owned by lender");
    err.statusCode = 404;
    throw err;
  }

  dispute.timeline.push({
    actor: lenderId,
    role: "LENDER",
    message,
    attachments,
  });

  await dispute.save();
  return dispute;
};
