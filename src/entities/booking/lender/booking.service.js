import mongoose from "mongoose";
import { Booking } from "../booking.model.js";
import Stripe from "stripe";

export const getAllocatedBookingsForLenderService = async (lenderId, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = {
    "allocatedLender.lenderId": lenderId
  };

  // Optional filters
  if (query.deliveryStatus) {
    filter.deliveryStatus = query.deliveryStatus;
  }

  if (query.paymentStatus) {
    filter.paymentStatus = query.paymentStatus;
  }

  const [bookings, totalItems] = await Promise.all([
    Booking.find(filter)
      .populate([
        { path: "customer", select: "name email phone" },
        { path: "masterdressId" }, // master dress document
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Booking.countDocuments(filter),
  ]);

  return {
    data: bookings,
    pagination: {
      currentPage: page,
      itemsPerPage: limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
};

// upcoming bookings 

export const getUpcomingBookingsForLenderService = async (lenderId, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize day start

  const filter = {
    "allocatedLender.lenderId": lenderId,
    rentalStartDate: { $gt: today }
  };

  // Optional: filter by size
  if (query.size) {
    filter.size = query.size;
  }

  // Optional: filter by delivery method
  if (query.deliveryMethod) {
    filter.deliveryMethod = query.deliveryMethod;
  }

  const [bookings, totalItems] = await Promise.all([
    Booking.find(filter)
      .populate([
        { path: "customer", select: "name email phone" },
        { path: "masterdressId" }
      ])
      .sort({ rentalStartDate: 1 })  // closest upcoming first
      .skip(skip)
      .limit(limit)
      .lean(),

    Booking.countDocuments(filter)
  ]);

  return {
    data: bookings,
    pagination: {
      currentPage: page,
      itemsPerPage: limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
};


// auto payment after accepting the booking by lender 

export const acceptOrRejectBookingService = async ({ bookingId, lenderId, action }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});
    const Booking = mongoose.model("Booking");
    const User = mongoose.model("User");

    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) throw new Error("Booking not found");

    if (booking.allocatedLender.lenderId.toString() !== lenderId.toString()) {
      throw new Error("Unauthorized: Not allocated lender");
    }

    // ------------------------------
    // REJECT BOOKING
    // ------------------------------
    if (action === "reject") {
      booking.deliveryStatus = "RejectedByLender";
      booking.paymentStatus = "NotCharged";
      await booking.save({ session });

      await session.commitTransaction();
      session.endSession();
      return { deliveryStatus: "rejected", booking };
    }

    // ------------------------------
    // ACCEPT BOOKING
    // ------------------------------
    const user = await User.findById(booking.customer).session(session);
    if (!user) throw new Error("Customer not found");

    if (!user.stripeCustomerId || !user.defaultPaymentMethodId) {
      throw new Error("No saved payment method");
    }

    let finalAmount = booking.totalAmount;

    // ------------------------------
    // APPLY ONE-TIME DISCOUNT BASED ON USER FIELDS
    // ------------------------------
    let discount = 0;

    if (!user.firstBookingDiscountUsed && user.totalSpent < 1) {
      discount = 10;
      user.firstBookingDiscountUsed = true;
    } else if (!user.spent300DiscountUsed && user.totalSpent >= 300 && user.totalSpent < 600) {
      discount = 20;
      user.spent300DiscountUsed = true;
    } else if (!user.spent600DiscountUsed && user.totalSpent >= 600) {
      discount = 30;
      user.spent600DiscountUsed = true;
    }

    finalAmount -= discount;

    // ------------------------------
    // CHARGE USER
    // ------------------------------
    let paymentIntent;
    let paymentError = null;

    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(finalAmount * 100),
        currency: "aud",
        customer: user.stripeCustomerId,
        payment_method: user.defaultPaymentMethodId,
        off_session: true,
        confirm: true
      });

    } catch (err) {
      paymentError = err;
    }

    // ------------------------------
    // HANDLE PAYMENT ERRORS
    // ------------------------------
    if (paymentError) {
      const stripeError = paymentError.raw?.message || paymentError.message;

      if (paymentError.code === "authentication_required" ||
          paymentError.code === "card_declined") {

        booking.paymentStatus = "Failed";
        booking.paymentErrorMessage = stripeError;
        booking.deliveryStatus = "PaymentFailed";

        await booking.save({ session });
        await session.commitTransaction();
        session.endSession();

        return {
          deliveryStatus: "failed_user_action_required",
          error: stripeError,
          booking
        };
      }

      booking.paymentStatus = "RetryPending";
      booking.paymentErrorMessage = stripeError;
      booking.deliveryStatus = "PaymentRetryScheduled";

      await booking.save({ session });
      await session.commitTransaction();
      session.endSession();

      return {
        status: "retry_scheduled",
        error: stripeError,
        booking
      };
    }

    // ------------------------------
    // SUCCESS
    // ------------------------------
    booking.paymentStatus = "Paid";
    booking.paymentIntentId = paymentIntent.id;
    booking.deliveryStatus = "AcceptedByLender";
    booking.paymentErrorMessage = null;

    await booking.save({ session });

    // ------------------------------
    // UPDATE USER TOTAL SPENT
    // ------------------------------
    user.totalSpent += finalAmount;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { deliveryStatus: "accepted_and_charged", booking };

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

