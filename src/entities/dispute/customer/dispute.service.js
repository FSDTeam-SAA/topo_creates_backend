import mongoose from "mongoose";
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
      },
    ],
  });

  const savedDispute = await dispute.save();

  // Link the dispute to the booking
  booking.dispute = savedDispute._id;
  await booking.save();

  return savedDispute;
};


export const getDisputesByCustomer = async (customerId, filters = {}) => {
  const query = { customer: customerId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  return await Dispute.find(query).sort({ createdAt: -1 });
};


export const getDisputeById = async (customerId, disputeId) => {
  if (!mongoose.Types.ObjectId.isValid(disputeId)) return null;

  return await Dispute.findOne({ _id: disputeId, customer: customerId });
};


export const replyToSupport = async (disputeId, customerId, message) => {
  const dispute = await getDisputeById(customerId, disputeId);
  if (!dispute) throw new Error("Dispute not found");

  dispute.history.push({
    action: "replied",
    actor: "customer",
    timestamp: new Date(),
    note: message
  });

  return await dispute.save();
};