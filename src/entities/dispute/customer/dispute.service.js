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

