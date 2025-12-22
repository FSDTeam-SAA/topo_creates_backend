import mongoose from 'mongoose';
import { Booking } from '../../booking/booking.model.js';
import Payment from './payment.model.js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createBookingPaymentService = async ({
  bookingId,
  customerId
}) => {
  // Load booking with populated relationships
  const booking = await Booking.findById(bookingId).populate(
    'customer lender listing'
  );

  if (!booking) throw new Error('Booking not found');
  if (booking.paymentStatus === 'Paid') throw new Error('Booking already paid');

  // Find existing Pending payment
  let payment = await Payment.findOne({
    bookingId: booking._id,
    status: 'Pending'
  });

  // If no pending payment, create one
  if (!payment) {
    payment = await Payment.create({
      type: 'booking',
      bookingId: booking._id,
      customerId: booking.customer?._id,
      lenderId: booking.lender?._id || null,
      listing: booking.listing?._id || null,
      amount: booking.totalAmount,
      currency: 'aud',
      status: 'Pending'
    });
  }

  // Create Stripe checkout session
  const session = await stripe.checkout.sessions.create(
    {
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: booking.customer.email,
      line_items: [
        {
          price_data: {
            currency: 'aud',
            product_data: {
              name: `Dress Rental`,
              description: `Rental from ${booking.rentalStartDate.toDateString()} to ${booking.rentalEndDate.toDateString()}`
            },
            unit_amount: booking.totalAmount * 100
          },
          quantity: 1
        }
      ],
      metadata: {
        paymentId: payment._id.toString(),
        bookingId: booking._id.toString()
      },
      success_url: `${process.env.FRONTEND_URL}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/booking-cancelled`
    },
    {
      // Prevent Stripe duplicate sessions
      idempotencyKey: payment._id.toString()
    }
  );

  // Save Stripe session info
  payment.stripe = {
    checkoutSessionId: session.id,
    idempotencyKey: payment._id.toString()
  };

  await payment.save();

  return session.url;
};

// Create a Stripe Checkout session for a booking

// export const createBookingPaymentService = async ({ bookingId, customerId }) => {
//   const booking = await Booking.findById(bookingId).populate("customer lender listing");
//   // console.log("bsda",bookingId);

//   if (!booking) throw new Error("Booking not found");
//   if (booking.paymentStatus === "Paid") throw new Error("Booking already paid");

//   let payment = await Payment.findOne({ bookingId: booking._id, status: "Pending" });
//   if (!payment) {
//     // Create a new Payment record
//     payment = await Payment.create({
//       type: "booking",
//       bookingId: booking._id,
//       customerId: booking.customer._id,
//       lenderId: booking.lender._id,
//       listing: booking.listing._id,
//       amount: booking.totalAmount,
//       currency: "aud",
//       status: "Pending",
//     });
//   }
//   // Create Stripe Checkout Session
//   const session = await stripe.checkout.sessions.create({
//     payment_method_types: ["card"],
//     mode: "payment",
//     customer_email: booking.customer.email,
//     line_items: [
//       {
//         price_data: {
//           currency: "aud",
//           product_data: {
//             name: `Dress Rental - ${booking.dressId}`,
//             description: `Rental from ${booking.rentalStartDate.toDateString()} to ${booking.rentalEndDate.toDateString()}`
//           },
//           unit_amount: booking.totalAmount * 100
//         },
//         quantity: 1
//       }
//     ],
//     metadata: {
//       paymentId: payment._id.toString(),
//       bookingId: booking._id.toString()
//     },
//     success_url: `${process.env.FRONTEND_URL}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
//     cancel_url: `${process.env.FRONTEND_URL}/booking-cancelled`
//   },
//   {
//       // 4️⃣ Idempotency key prevents duplicate sessions
//       idempotencyKey: payment._id.toString(),
//     }
// );

//   payment.stripe.checkoutSessionId = session.id;
//   payment.stripe.idempotencyKey = payment._id.toString();

//   await payment.save();

//   return session.url;
// };

export const createSetupIntentService = async (userId) => {
  const User = mongoose.model('User');
  const user = await User.findById(userId);

  if (!user) throw new Error('User not found');

  // 1. Create Stripe Customer if missing
  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user._id.toString() }
    });
    stripeCustomerId = customer.id;
    user.stripeCustomerId = customer.id;
    await user.save();
  }

  // 2. Create Stripe Checkout Session for SetupIntent
  const session = await stripe.checkout.sessions.create({
    mode: 'setup',
    customer: stripeCustomerId,
    payment_method_types: ['card'],
    metadata: { userId: user._id.toString() },
    success_url: `${process.env.FRONTEND_URL}/booking-success`,
    cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`
  });

  return { url: session.url };
};
