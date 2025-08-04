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


export const getLenderDisputesService = async (lenderId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [disputes, total] = await Promise.all([
    Dispute.find({ createdBy: lenderId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("booking", "listing deliveryMethod status") 
      .lean(),

    Dispute.countDocuments({ createdBy: lenderId })
  ]);

  return {
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

  const dispute = await Dispute.findOne({ _id: disputeId, createdBy: lenderId });

  if (!dispute) {
    const err = new Error("Dispute not found or access denied");
    err.statusCode = 404;
    throw err;
  }

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

  // Update escalation fields
  dispute.isEscalated = true;
  dispute.escalationReason = reason;
  dispute.escalationDescription = description;
  dispute.escalationPriority = priority;
  dispute.escalationConfirmed = confirmed;
  dispute.escalationScheduleCall = !!scheduleCall;
  dispute.escalationEvidence = evidence;
  dispute.escalatedAt = new Date();
  dispute.status = "Escalated";

  // Add to timeline
  dispute.timeline.push({
    actor: lenderId,
    role: "LENDER",
    message: `Dispute escalated with priority "${priority}": ${reason}`,
    attachments: evidence,
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
