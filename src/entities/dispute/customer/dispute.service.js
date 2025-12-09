import { Booking } from "../../booking/booking.model.js";
import { Dispute } from "../dispute.model.js";


export const createDispute = async (customerId, bookingId, disputeData) => {
  const booking = await Booking.findOne({ _id: bookingId, customer: customerId });
  
  if (!booking) {
    const err = new Error("Booking not found or not owned by customer");
    err.statusCode = 404;
    throw err;
  }

  const dispute = new Dispute({
    booking: bookingId,
    createdBy: customerId,
    ...disputeData,
    status: "Pending",
    timeline: [
      {
        actor: customerId,
        role: "USER",
        message: `Issue reported: '${disputeData.issueType}'`,
        attachments: disputeData.evidence || [],
        type: "submission", 
      },
    ],
  });

  const savedDispute = await dispute.save();

  booking.dispute = savedDispute._id;
  await booking.save();

  return savedDispute;
};


export const getCustomerDisputesService = async (customerId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [disputes, total] = await Promise.all([
    Dispute.find({ createdBy: customerId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("booking", "listing deliveryMethod status") 
      .lean(),

    Dispute.countDocuments({ createdBy: customerId })
  ]);

  return {
    disputes,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};


export const getCustomerDisputeByIdService = async (customerId, disputeId) => {
  const dispute = await Dispute.findOne({
    _id: disputeId,
    createdBy: customerId,
  })
    .populate("booking", "listing deliveryMethod status")
    .populate("createdBy", "name email") 
    .lean();

  return dispute;
};


export const updateDispute = async (customerId, disputeId, updateData) => {
  const dispute = await Dispute.findById(disputeId);

  if (!dispute) {
    const err = new Error("Dispute not found");
    err.statusCode = 404;
    throw err;
  }

  if (dispute.createdBy.toString() !== customerId.toString()) {
    const err = new Error("Unauthorized to update this dispute");
    err.statusCode = 403;
    throw err;
  }

  if (["Resolved", "Closed"].includes(dispute.status)) {
    const err = new Error("Cannot update a resolved or closed dispute");
    err.statusCode = 400;
    throw err;
  }

  const changes = [];

  if (updateData.issueType && updateData.issueType !== dispute.issueType) {
    changes.push(`Issue type updated to '${updateData.issueType}'`);
    dispute.issueType = updateData.issueType;
  }

  if (updateData.description && updateData.description !== dispute.description) {
    changes.push("Description updated");
    dispute.description = updateData.description;
  }

  if (updateData.evidence && updateData.evidence.length > 0) {
    dispute.evidence.push(...updateData.evidence);
    changes.push("New evidence added");
  }

  // Add to timeline
  dispute.timeline.push({
    actor: customerId,
    role: "USER",
    message:
      changes.length > 0
        ? `Customer updated dispute: ${changes.join(", ")}`
        : "Customer made an update",
    attachments: updateData.evidence || [],
    type: "update", 
  });

  const updatedDispute = await dispute.save();
  return updatedDispute;
};


export const getTimelineByCustomer = async (userId, disputeId) => {
  const dispute = await Dispute.findById(disputeId)
    .populate('timeline.actor', 'name role profileImage') 
    .lean();

  if (!dispute) throw new Error("Dispute not found");

  // Only the dispute creator can view their timeline
  if (dispute.createdBy.toString() !== userId.toString()) {
    const err = new Error("You are not authorized to view this dispute");
    err.statusCode = 403;
    throw err;
  }

  return dispute.timeline || [];
};

