import mongoose from "mongoose";
import { generateResponse } from "../../../lib/responseFormate.js";
import payOutModel from "../payOut/payOut.model.js";
import {
  getLenderByIdService,
  sendDeactivationCodeService,
  startDeactivationService,
  updateLenderByIdService,
  verifyDeactivationCodeService
} from "./account.service.js";
import { Dispute } from "../../dispute/dispute.model.js";
import Listing from "../Listings/listings.model.js";
import { Booking } from "../../booking/booking.model.js";
import User from "../../auth/auth.model.js";


export const getLenderById = async (req, res) => {
  try {
    const lender = await getLenderByIdService(req.params.id);
    if (!lender) return generateResponse(res, 404, false, "Lender not found");
    generateResponse(res, 200, true, "Lender profile fetched", lender);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch lender profile", error.message);
  }
};


export const updateLenderById = async (req, res) => {
  try {
    const updated = await updateLenderByIdService(req.params.id, req.body);
    if (!updated) return generateResponse(res, 404, false, "Lender not found");
    generateResponse(res, 200, true, "Profile updated", updated);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to update profile", error.message);
  }
};


export const startDeactivation = async (req, res) => {
  try {
    const lenderId = req.user._id;
    const { reason, feedback } = req.body;
    const result = await startDeactivationService({ lenderId, reason, feedback });
    generateResponse(res, 200, true, "Deactivation process initiated", result);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to start deactivation", error.message);
  }
};


export const sendDeactivationCode = async (req, res) => {
  try {
    const result = await sendDeactivationCodeService(req.user._id); 
    generateResponse(res, 200, true, "Verification code sent", result);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to send verification code", error.message);
  }
};


export const verifyDeactivationCode = async (req, res) => {
  try {
    const { code } = req.body;
    const result = await verifyDeactivationCodeService({ userId: req.user._id, code });
    generateResponse(res, 200, true, "Account deactivated", result);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to deactivate account", error.message);
  }
};


export const getLenderByIdWithStats = async (req, res, next) => {
  try {
    const { lenderId } = req.params;
    const { booking } = req.query;

    if (!mongoose.Types.ObjectId.isValid(lenderId)) {
      return res.status(400).json({ message: "Invalid lender ID" });
    }

    /* =========================
       1. GET LENDER USER
    ========================= */
    const lender = await User.findById(lenderId).lean();
    if (!lender) {
      return res.status(404).json({ message: "Lender not found" });
    }

    /* =========================
       2. BOOKINGS (OPTIONAL)
    ========================= */
    let bookings = [];
    let bookingCount = 0;
    let bookingIds = [];

    if (booking === "true") {
      bookings = await Booking.find({
        "allocatedLender.lenderId": lenderId,
      }).lean();

      bookingCount = bookings.length;
      bookingIds = bookings.map(b => b._id);
    }

    /* =========================
       3. LISTINGS (APPROVED)
    ========================= */
    const listings = await Listing.find({
      lenderId,
      approvalStatus: "approved",
      isActive: true,
    }).lean();

    const approvedListingCount = listings.length;

    /* =========================
       4. DISPUTES (BY BOOKINGS)
    ========================= */
    let disputes = [];
    let disputeCount = 0;

    if (bookingIds.length > 0) {
      disputes = await Dispute.find({
        booking: { $in: bookingIds },
      }).lean();

      disputeCount = disputes.length;
    }

    /* =========================
       5. PAYOUT SUM
    ========================= */
    const payoutAggregation = await payOutModel.aggregate([
      {
        $match: {
          lenderId: new mongoose.Types.ObjectId(lenderId),
          status: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRequestedAmount: { $sum: "$requestedAmount" },
        },
      },
    ]);

    const totalPaidAmount =
      payoutAggregation.length > 0
        ? payoutAggregation[0].totalRequestedAmount
        : 0;

    /* =========================
       FINAL RESPONSE
    ========================= */
    return res.status(200).json({
      success: true,
      data: {
        lender,
        bookings: {
          count: bookingCount,
          data: bookings,
        },
        listings: {
          approvedCount: approvedListingCount,
          data: listings,
        },
        disputes: {
          count: disputeCount,
          data: disputes,
        },
        payouts: {
          totalPaidAmount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};