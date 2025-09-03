import { Booking } from "../../booking/booking.model.js";
import Payment from "./payment.model.js";


/**
 * Handle Stripe webhook events for booking payments
 */
export const handleBookingPaymentEvents = async (event) => {
  try {
    switch (event.type) {
      // Payment completed successfully via checkout
      case "checkout.session.completed": {
        const session = event.data.object;
        const { paymentId, bookingId } = session.metadata;

        const payment = await Payment.findById(paymentId);
        if (!payment) return console.warn(`Payment not found: ${paymentId}`);
        if (payment.status === "Paid") return; // already handled

        // Update Payment
        payment.status = "Paid";
        payment.stripe.paymentIntentId = session.payment_intent;
        await payment.save();

        // Update Booking
        const booking = await Booking.findById(bookingId);
        if (booking) booking.paymentStatus = "Paid";
        await booking.save();

        console.log(`✅ Checkout session completed: Payment ${paymentId}, Booking ${bookingId}`);
        break;
      }

      // Extra safety: payment intent succeeded
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const payment = await Payment.findOne({ "stripe.paymentIntentId": paymentIntent.id });
        if (!payment) return;

        if (payment.status !== "Paid") {
          payment.status = "Paid";
          await payment.save();
          console.log(`✅ PaymentIntent succeeded: Payment ${payment._id}`);
        }
        break;
      }

      // Payment failed
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        const payment = await Payment.findOne({ "stripe.paymentIntentId": paymentIntent.id });
        if (!payment) return;

        payment.status = "Failed";
        await payment.save();

        const booking = await Booking.findById(payment.bookingId);
        if (booking) booking.paymentStatus = "Failed";
        await booking.save();

        console.warn(`❌ Payment failed: Payment ${payment._id}`);
        break;
      }

      // Checkout session expired
      case "checkout.session.expired": {
        const session = event.data.object;
        const { paymentId, bookingId } = session.metadata;

        const payment = await Payment.findById(paymentId);
        if (!payment) return;
        if (payment.status !== "Pending") return; // already handled

        payment.status = "Expired";
        await payment.save();

        const booking = await Booking.findById(bookingId);
        if (booking) booking.paymentStatus = "Expired";
        await booking.save();

        console.log(`⚠️ Checkout session expired: Payment ${paymentId}, Booking ${bookingId}`);
        break;
      }

      // Refund happened
      case "charge.refunded": {
        const charge = event.data.object;
        const payment = await Payment.findOne({ "stripe.paymentIntentId": charge.payment_intent });
        if (!payment) return;

        payment.status = "Refunded";
        payment.refundDetails.push({
          refundId: charge.refunds.data[0]?.id || "unknown",
          amount: charge.amount_refunded / 100,
        });
        await payment.save();

        const booking = await Booking.findById(payment.bookingId);
        if (booking) booking.paymentStatus = "Refunded";
        await booking.save();

        console.log(`🔄 Payment refunded: Payment ${payment._id}`);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`❌ Error handling Stripe event ${event.type}:`, err);
  }
};
