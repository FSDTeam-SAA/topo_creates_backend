// payout.service.js

import { sendEmail } from "../../../lib/resendEmial.js";
import { payoutRequestCreatedTemplate, payoutRequestReceivedTemplate } from "../../../lib/emailTemplates/payout.templates.js";
import User from "../../auth/auth.model.js";
import { Booking } from "../../booking/booking.model.js";
import paymentModel from "../../Payment/Booking/payment.model.js";
import SubscriptionPlan from "../../subscription/subscription.model.js";
import payOutModel from "./payOut.model.js";



export const createPayoutRequestService = async ({ lenderId, bookingId }) => {
  // 1️⃣ Validate lender
  const lender = await User.findById(lenderId);
  if (!lender) throw new Error("Lender not found");
  if (!lender.stripeOnboardingCompleted) {
    throw new Error("Complete Stripe onboarding before requesting payouts");
  }

  // 2️⃣ Find booking that is Paid
  const booking = await Booking.findOne({
    _id: bookingId,
    "allocatedLender.lenderId": lenderId,
    paymentStatus: "Paid"
  });

  if (!booking) {
    throw new Error("No valid paid booking found for this request");
  }

  // 3️⃣ Get subscription plan
  if (!lender.subscription || !lender.subscription.planId) {
    throw new Error("No active subscription found for this lender");
  }

  const plan = await SubscriptionPlan.findById(lender.subscription.planId);
  if (!plan) throw new Error("Subscription plan not found");

  // 4️⃣ Calculate commission and requested amount
  const commission = plan.commission || 0;
  const bookingAmount = booking.totalAmount;
  const requestedAmount = booking.lenderPrice - (booking.lenderPrice * commission) / 100;
  const adminsProfit=(booking.lenderPrice * commission) / 100

  // 5️⃣ Save payout request
  const payout = await payOutModel.create({
    lenderId,
    lenderPrice:booking.lenderPrice,
    bookingId: booking._id,
    adminsProfit,
    bookingAmount,
    requestedAmount,
    commission,
    status: "pending",
  });

  // 6️⃣ Send confirmation email to lender
  try {
    await sendEmail({
      to: lender.email,
      subject: 'Payout Request Submitted Successfully',
      html: payoutRequestCreatedTemplate(
        lender.firstName || 'Lender',
        requestedAmount,
        booking._id,
        commission
      )
    });
  } catch (error) {
    console.error('Failed to send payout confirmation email to lender:', error);
  }

  // 7️⃣ Send notification email to admin
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@topocreates.com';
    await sendEmail({
      to: adminEmail,
      subject: 'New Payout Request Received',
      html: payoutRequestReceivedTemplate(
        `${lender.firstName || ''} ${lender.lastName || ''}`.trim() || 'Unknown Lender',
        lenderId,
        requestedAmount,
        booking._id,
        booking.lenderPrice,
        adminsProfit
      )
    });
  } catch (error) {
    console.error('Failed to send payout notification email to admin:', error);
  }

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

