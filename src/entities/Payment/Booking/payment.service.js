import { Booking } from "../../booking/booking.model.js";
import Payment from "./payment.model.js";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe Checkout session for a booking
 */
export const createBookingPaymentService = async ({ bookingId, customerId }) => {
  const booking = await Booking.findById(bookingId).populate("customer lender listing");
  // console.log("bsda",bookingId);
  
  if (!booking) throw new Error("Booking not found");
  if (booking.paymentStatus === "Paid") throw new Error("Booking already paid");





  // Create Payment record
  const payment = await Payment.create({
    type: "booking",
    bookingId: booking._id,
    customerId: booking.customer._id,
    lenderId: booking.lender._id,
    amount: booking.totalAmount,
    listing:booking.listing._id,
    status: "Pending",
  });

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    customer_email: booking.customer.email,
    line_items: [
      {
        price_data: {
          currency: "aud",
          product_data: {
            name: `Dress Rental - ${booking.dressId}`,
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
  });

  payment.stripe.checkoutSessionId = session.id;
  await payment.save();

  return session.url;
};


