import mongoose from 'mongoose';
import { Booking } from '../booking.model.js';
import Stripe from 'stripe';
import { sendEmail } from '../../../lib/resendEmial.js';
import {
  bookingConfirmedTemplate,
  bookingRejectedTemplate,
  paymentFailedTemplate
} from '../../../lib/emailTemplates/booking.templates.js';
import User from '../../auth/auth.model.js';
import Listing from '../../lender/Listings/listings.model.js';
import MasterDress from '../../admin/Lisitngs/ReviewandMain Site Listing/masterDressModel.js';

export const getAllocatedBookingsForLenderService = async (lenderId, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = {
    'allocatedLender.lenderId': lenderId
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
        { path: 'customer', select: 'name email phone' },
        { path: 'masterdressId' } // master dress document
      ])
      .sort({ createdAt: -1 })
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

// upcoming bookings

export const getUpcomingBookingsForLenderService = async (lenderId, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize day start

  const filter = {
    'allocatedLender.lenderId': lenderId,
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
        { path: 'customer', select: 'name email phone' },
        { path: 'masterdressId' }
      ])
      .sort({ rentalStartDate: 1 }) // closest upcoming first
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

export const acceptOrRejectBookingService = async ({
  bookingId,
  lenderId,
  action
}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
    const Booking = mongoose.model('Booking');
    const User = mongoose.model('User');

    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) throw new Error('Booking not found');

    const allocatedLenderId = booking.allocatedLender?.lenderId;
    if (!allocatedLenderId) {
      throw new Error('Allocated lender missing for this booking.');
    }

    if (allocatedLenderId.toString() !== lenderId.toString()) {
      throw new Error('Unauthorized: Not allocated lender');
    }

    // ------------------------------
    // REJECT BOOKING
    // ------------------------------
    if (action === 'reject') {
      booking.deliveryStatus = 'RejectedByLender';
      booking.paymentStatus = 'NotCharged';
      await booking.save({ session });

      // Send rejection email
      try {
        const customer = await User.findById(booking.customer);
        const MasterDress = mongoose.model('MasterDress');
        const dress = await MasterDress.findById(booking.masterdressId);

        if (customer?.email) {
          await sendEmail({
            to: customer.email,
            subject: 'Booking Rejected',
            html: bookingRejectedTemplate(
              customer.firstName || customer.name || 'Customer',
              dress?.dressName || 'Your Dress',
              'The dress is no longer available for the requested dates'
            )
          });
        }
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError);
      }

      await session.commitTransaction();
      session.endSession();
      return { deliveryStatus: 'rejected', booking };
    }

    // ------------------------------
    // ACCEPT BOOKING
    // ------------------------------
    const user = await User.findById(booking.customer).session(session);
    if (!user) throw new Error('Customer not found');

    if (!user.stripeCustomerId || !user.defaultPaymentMethodId) {
      throw new Error('No saved payment method');
    }

    let finalAmount = booking.totalAmount;

    // ------------------------------
    // APPLY ONE-TIME DISCOUNT BASED ON USER FIELDS
    // ------------------------------
    let discount = 0;

    if (!user.firstBookingDiscountUsed && user.totalSpent < 1) {
      discount = 10;
      user.firstBookingDiscountUsed = true;
    } else if (
      !user.spent300DiscountUsed &&
      user.totalSpent >= 300 &&
      user.totalSpent < 600
    ) {
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
        currency: 'aud',
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

      if (
        paymentError.code === 'authentication_required' ||
        paymentError.code === 'card_declined'
      ) {
        booking.paymentStatus = 'Failed';
        booking.paymentErrorMessage = stripeError;
        booking.deliveryStatus = 'PaymentFailed';

        await booking.save({ session });
        await session.commitTransaction();
        session.endSession();

        return {
          deliveryStatus: 'failed_user_action_required',
          error: stripeError,
          booking
        };
      }

      booking.paymentStatus = 'RetryPending';
      booking.paymentErrorMessage = stripeError;
      booking.deliveryStatus = 'PaymentRetryScheduled';

      // Send payment failed email
      try {
        const customer = await User.findById(booking.customer);
        const MasterDress = mongoose.model('MasterDress');
        const dress = await MasterDress.findById(booking.masterdressId);

        if (customer?.email) {
          await sendEmail({
            to: customer.email,
            subject: 'Payment Failed - Please Update Your Payment Method',
            html: paymentFailedTemplate(
              customer.firstName || customer.name || 'Customer',
              dress?.dressName || 'Your Dress',
              booking.totalAmount.toFixed(2),
              stripeError
            )
          });
        }
      } catch (emailError) {
        console.error('Error sending payment failed email:', emailError);
      }

      await booking.save({ session });
      await session.commitTransaction();
      session.endSession();

      return {
        status: 'retry_scheduled',
        error: stripeError,
        booking
      };
    }

    // ------------------------------
    // SUCCESS
    // ------------------------------
    booking.paymentStatus = 'Paid';
    booking.stripePaymentIntentId = paymentIntent.id;
    booking.deliveryStatus = 'AcceptedByLender';
    booking.paymentErrorMessage = null;

    await booking.save({ session });

    // ------------------------------
    // UPDATE USER TOTAL SPENT
    // ------------------------------
    user.totalSpent += finalAmount;
    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send confirmation email
    try {
      const customer = await User.findById(booking.customer);
      const MasterDress = mongoose.model('MasterDress');
      const dress = await MasterDress.findById(booking.masterdressId);
      const lender = await User.findById(booking.allocatedLender.lenderId);

      const startDate = new Date(booking.rentalStartDate).toLocaleDateString(
        'en-US',
        { year: 'numeric', month: 'short', day: 'numeric' }
      );
      const endDate = new Date(booking.rentalEndDate).toLocaleDateString(
        'en-US',
        { year: 'numeric', month: 'short', day: 'numeric' }
      );

      if (customer?.email) {
        await sendEmail({
          to: customer.email,
          subject: 'Booking Confirmed!',
          html: bookingConfirmedTemplate(
            customer.firstName || customer.name || 'Customer',
            dress?.dressName || 'Your Dress',
            booking.rentalDurationDays.toString(),
            startDate,
            endDate,
            finalAmount.toFixed(2)
          )
        });
      }

      if (lender?.email) {
        await sendEmail({
          to: lender.email,
          subject: 'Booking Accepted - Prepare for Shipment',
          html: bookingConfirmedTemplate(
            lender.firstName || lender.name || 'Lender',
            dress?.dressName || 'Dress',
            booking.rentalDurationDays.toString(),
            startDate,
            endDate,
            finalAmount.toFixed(2)
          )
        });
      }
    } catch (emailError) {
      console.error('Error sending booking confirmation email:', emailError);
    }

    return { deliveryStatus: 'accepted_and_charged', booking };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const createManualBookingService = async ({ userId, body }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });

    const {
      listingId,
      rentalStartDate,
      rentalEndDate,
      rentalDurationDays,
      size
    } = body;

    // Validate listing ID
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      throw new Error('Invalid listing ID.');
    }

    const listing = await Listing.findById(listingId).session(session);
    if (
      !listing ||
      !listing.isActive ||
      listing.approvalStatus !== 'approved'
    ) {
      throw new Error('Listing not found, inactive, or not approved.');
    }

    const masterDress = await MasterDress.findOne({
      dressName: listing.dressName
    }).session(session);
    if (!masterDress) throw new Error('Master dress not found.');

    const totalAmount = masterDress.basePrice || 0;

    // Rental price
    let rentalFee = 0;
    if (rentalDurationDays === 4) rentalFee = listing.rentalPrice.fourDays;
    else if (rentalDurationDays === 8)
      rentalFee = listing.rentalPrice.eightDays;
    else throw new Error('Invalid rental duration, must be 4 or 8 days.');

    const lender = await mongoose
      .model('User')
      .findById(userId)
      .session(session);
    if (!lender?.stripeCustomerId || !lender?.defaultPaymentMethodId) {
      throw new Error('Please add a payment method before booking.');
    }

    let paymentIntent;

    try {
      // Try auto-charge
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100),
        currency: 'aud',
        customer: lender.stripeCustomerId,
        payment_method: lender.defaultPaymentMethodId,
        off_session: true,
        confirm: true
      });
    } catch (stripeErr) {
      // Handle Stripe-specific errors clearly
      if (stripeErr.type === 'StripeCardError') {
        throw new Error(stripeErr.message || 'Your card was declined.');
      }

      if (stripeErr.type === 'StripeAuthenticationError') {
        throw new Error(
          'Your bank requires authentication. Please update your payment method.'
        );
      }

      if (stripeErr.type === 'StripeInvalidRequestError') {
        throw new Error('Invalid payment request. Please contact support.');
      }

      throw new Error(
        'Payment failed. Please try again with a different card.'
      );
    }

    // Create booking (only if payment success)
    const bookingData = {
      customer: userId,
      masterdressId: masterDress._id,
      dressName: listing.dressName,
      listing: listing._id,
      rentalStartDate,
      rentalEndDate,
      rentalDurationDays,
      size,
      rentalFee,
      totalAmount,
      stripePaymentIntentId: paymentIntent.id,
      paymentStatus: 'Paid',
      deliveryStatus: 'Delivered',
      deliveryMethod: 'Manual booking',
      isManualBooking: true
    };

    const booking = new Booking(bookingData);
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    return booking;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    throw new Error(
      err.message || 'Something went wrong while creating booking.'
    );
  }
};
