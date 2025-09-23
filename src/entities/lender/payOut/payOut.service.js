// payout.service.js

import User from "../../auth/auth.model.js";
import paymentModel from "../../Payment/Booking/payment.model.js";
import SubscriptionPlan from "../../subscription/subscription.model.js";
import payOutModel from "./payOut.model.js";



export const createPayoutRequestService = async ({ lenderId, bookingId }) => {
  // 1. Check lender
  const lender = await User.findById(lenderId);
//   console.log("lender ",lender);
  if (!lender) {
    throw new Error("Lender not found");
  }
  if (!lender.stripeOnboardingCompleted) {
    throw new Error("Complete Stripe onboarding before requesting payouts");
  }

  // 2. Find booking/payment
  const payment = await paymentModel.findOne({
    bookingId,
    lenderId,
    status: "Paid",
  });

  if (!payment) {
    throw new Error("No valid paid booking found for this request");
  }

  // 3. Get subscription plan
  if (!lender.subscription || !lender.subscription.planId) {
    throw new Error("No active subscription found for this lender");
  }

  const plan = await SubscriptionPlan.findById(lender.subscription.planId);
  if (!plan) {
    throw new Error("Subscription plan not found");
  }

  const commission = plan.commission || 0;
  const bookingAmount = payment.amount;
  const requestedAmount = bookingAmount - (bookingAmount * commission) / 100;
  // 4. Save payout
  const payout = await payOutModel.create({
    lenderId,
    bookingId: payment.bookingId,
    bookingAmount,
    requestedAmount,
    commission,
    status: "pending",
  });

  return payout;
};


/**
 * Get payouts for a lender (dashboard)
 */
export const getPayoutsByLenderService = async (lenderId, { page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;

  const payouts = await payOutModel.find({ lenderId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await payOutModel.countDocuments({ lenderId });

  return { payouts, total, page, limit };
};

/**
 * Get payout by ID (lender or admin)
 */
export const getPayoutByIdService = async (payoutId) => {
  const payout = await payOutModel.findById(payoutId);
  if (!payout) throw new Error("Payout not found");
  return payout;
};

/**
 * Admin: Get all payouts with pagination & optional filter
 */
export const getAllPayoutsService = async ({ page = 1, limit = 10, filter = {} }) => {
  const skip = (page - 1) * limit;

  const payouts = await payOutModel.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await payOutModel.countDocuments(filter);

  return { payouts, total, page, limit };
};

