import mongoose from "mongoose";
import { Dispute } from "../dispute.model.js";
import User from "../../auth/auth.model.js";
import { sendEmail } from "../../../lib/resendEmial.js";
import {
  disputeUnderReviewTemplate,
  disputeResponseTemplate,
  disputeResolvedTemplate,
} from "../../../lib/emailTemplates/dispute.templates.js";


export const getAllDisputesService = async (page = 1, limit = 10, status, monthFilter) => {
  const skip = (page - 1) * limit;

  const query = {};
  if (status) query.status = status;

  if (monthFilter === "current" || monthFilter === "previous") {
    const now = new Date();
    let startDate, endDate;

    if (monthFilter === "current") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    }

    query.createdAt = { $gte: startDate, $lte: endDate };
  }

  const [disputes, total, resolvedCount, pendingCount, avgResolutionTime] = await Promise.all([
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
          { path: "lender", select: "firstName lastName email profileImage" },
        ],
      })
      .populate({
        path: "createdBy",
        select: "firstName lastName email profileImage",
      })
      .lean(),

    Dispute.countDocuments(query),

    Dispute.countDocuments({
      status: "Resolved",
      ...(monthFilter === "current" || monthFilter === "previous" ? { createdAt: query.createdAt } : {}),
    }),

    Dispute.countDocuments({
      status: "Pending",
      ...(monthFilter === "current" || monthFilter === "previous" ? { createdAt: query.createdAt } : {}),
    }),

    // Calculate average resolution time (in hours)
    Dispute.aggregate([
      {
        $match: {
          status: "Resolved",
          ...(monthFilter === "current" || monthFilter === "previous" ? { createdAt: query.createdAt } : {}),
        },
      },
      {
        $project: {
          createdAt: 1,
          resolutionEntry: {
            $first: {
              $filter: {
                input: "$timeline",
                as: "entry",
                cond: { $eq: ["$$entry.type", "resolution"] },
              },
            },
          },
        },
      },
      {
        $project: {
          resolutionTimeMs: {
            $cond: [
              { $and: ["$resolutionEntry", "$resolutionEntry.timestamp"] },
              { $subtract: ["$resolutionEntry.timestamp", "$createdAt"] },
              null,
            ],
          },
        },
      },
      {
        $match: { resolutionTimeMs: { $ne: null } },
      },
      {
        $group: {
          _id: null,
          avgResolutionTimeMs: { $avg: "$resolutionTimeMs" },
        },
      },
    ]),
  ]);

  // Convert avg time (ms) → hours
  const avgTimeMs = avgResolutionTime?.[0]?.avgResolutionTimeMs || 0;
  const avgResolutionHours = (avgTimeMs / (1000 * 60 * 60)).toFixed(2);

  const resolutionRate = total > 0 ? ((resolvedCount / total) * 100).toFixed(2) : "0.00";

  return {
    stats: {
      totalDisputes: total,
      resolvedDisputes: resolvedCount,
      pendingDisputes: pendingCount,
      resolutionRate: `${resolutionRate}%`,
      avgResolutionTime: avgTimeMs
        ? `${avgResolutionHours} hrs`
        : "N/A",
    },
    disputes,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};


export const getDisputeByIdService = async (disputeId) => {
  if (!mongoose.Types.ObjectId.isValid(disputeId)) {
    const err = new Error("Invalid dispute ID");
    err.statusCode = 400;
    throw err;
  }

  const dispute = await Dispute.findById(disputeId)
    .populate({
      path: "booking",
      select: "listing deliveryMethod deliveryStatus status orderDate customer lender",
      populate: [
        {
          path: "listing",
          select: "title dressId dressName brand media rentalPrice"
        },
        {
          path: "customer",
          select: "firstName lastName email profileImage"
        },
        {
          path: "lender",
          select: "firstName lastName email profileImage"
        }
      ]
    })
    .populate("createdBy", "firstName lastName email profileImage")
    .lean();

  if (!dispute) {
    const err = new Error("Dispute not found");
    err.statusCode = 404;
    throw err;
  }

  // Optional: compute resolution time if resolved
  if (dispute.status === "Resolved" && Array.isArray(dispute.timeline)) {
    const resolutionEntry = dispute.timeline.find(t => t.type === "resolution");
    if (resolutionEntry && resolutionEntry.timestamp) {
      const resolutionTimeMs = new Date(resolutionEntry.timestamp) - new Date(dispute.createdAt);
      dispute.avgResolutionTime = `${(resolutionTimeMs / (1000 * 60 * 60)).toFixed(2)} hrs`;
    }
  }

  return dispute;
};


export const respondToDispute = async (adminId, disputeId, message, status) => {
  const dispute = await Dispute.findById(disputeId).populate('booking', 'customer lender');
  if (!dispute) throw new Error("Dispute not found");

  // Create timeline entry
  const entry = {
    actor: adminId,
    role: "ADMIN",
    message,
    type : "response",
  };

  dispute.timeline.push(entry);

  // Update status 
  if (status && dispute.status !== status) {
    dispute.status = status;
  }

  dispute.lastActionBy = adminId;
  dispute.lastActionAt = new Date();
  dispute.updatedBy = adminId;

  await dispute.save();

  // Send email notification to parties
  try {
    const admin = await User.findById(adminId);
    const customer = await User.findById(dispute.booking.customer);
    const lender = await User.findById(dispute.booking.lender);

    const adminName = admin ? (admin.firstName || admin.name || 'Support Team') : 'Support Team';
    
    // Notify customer
    if (customer?.email) {
      await sendEmail({
        to: customer.email,
        subject: 'New Response on Your Dispute',
        html: disputeResponseTemplate(
          customer.firstName || customer.name || 'User',
          adminName,
          message,
          dispute.booking._id.toString()
        ),
      });
    }
    
    // Notify lender
    if (lender?.email) {
      await sendEmail({
        to: lender.email,
        subject: 'New Response on Dispute',
        html: disputeResponseTemplate(
          lender.firstName || lender.name || 'User',
          adminName,
          message,
          dispute.booking._id.toString()
        ),
      });
    }
  } catch (emailError) {
    console.error('Error sending dispute response emails:', emailError);
  }

  return dispute;
};


export const resolveDispute = async (adminId, disputeId, message) => {
  const dispute = await Dispute.findById(disputeId).populate('booking', 'customer lender');
  if (!dispute) throw new Error("Dispute not found");

  // Add resolution timeline entry
  dispute.timeline.push({
    actor: adminId,
    role: "ADMIN",
    message: message || "Dispute marked as resolved",
    type: "resolution"
  });

  // Update status & audit fields
  dispute.status = "Resolved";
  dispute.resolvedBy = adminId;
  dispute.lastActionBy = adminId;
  dispute.lastActionAt = new Date();
  dispute.updatedBy = adminId;

  dispute.markModified("status");
  await dispute.save();

  // Send resolution email
  try {
    const customer = await User.findById(dispute.booking.customer);
    const lender = await User.findById(dispute.booking.lender);

    const resolution = message || "Dispute has been resolved by our team";
    const refundAmount = dispute.refundAmount ? dispute.refundAmount.toFixed(2) : null;

    // Notify customer
    if (customer?.email) {
      await sendEmail({
        to: customer.email,
        subject: 'Your Dispute Has Been Resolved',
        html: disputeResolvedTemplate(
          customer.firstName || customer.name || 'User',
          resolution,
          refundAmount,
          dispute.booking._id.toString()
        ),
      });
    }

    // Notify lender
    if (lender?.email) {
      await sendEmail({
        to: lender.email,
        subject: 'Dispute Resolution Completed',
        html: disputeResolvedTemplate(
          lender.firstName || lender.name || 'User',
          resolution,
          refundAmount,
          dispute.booking._id.toString()
        ),
      });
    }
  } catch (emailError) {
    console.error('Error sending dispute resolved emails:', emailError);
  }

  // Refetch to ensure fresh state
  const updatedDispute = await Dispute.findById(disputeId);

  return updatedDispute;
};


