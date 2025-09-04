import Stripe from "stripe";

import User from "../../auth/auth.model.js";
import Payment from "../Booking/payment.model.js";



const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

/**
 * Handle Stripe webhook events for subscription payments
 */
export const handleSubscriptionPaymentEvents = async (event) => {
  try {
    switch (event.type) {
      // Payment completed successfully via checkout
      case "checkout.session.completed": {
        const session = event.data.object;
        const { paymentId, planId, customerId } = session.metadata;

        const payment = await Payment.findById(paymentId);
        if (!payment) return console.warn(`Payment not found: ${paymentId}`);
        if (payment.status === "Paid") return; // already handled

        // Update Payment
        payment.status = "Paid";
        payment.stripe.paymentIntentId = session.payment_intent;
        await payment.save();

        // Update User subscription
        const user = await User.findById(customerId);
        if (!user) return;

        user.hasActiveSubscription = true;
        user.subscriptionStartDate = new Date();
        user.subscriptionExpireDate = new Date(
          new Date().setMonth(new Date().getMonth() + 1) // paid plan → 1 month default, adjust as needed
        );
        user.subscription = { planId };
        await user.save();

        console.log(`✅ Subscription checkout completed: Payment ${paymentId}, User ${customerId}`);
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

          // Update User subscription if not already done
          if (payment.type === "subscription" && payment.subscription?.planId) {
            const user = await User.findById(payment.customerId);
            if (user) {
              user.hasActiveSubscription = true;
              user.subscriptionStartDate = new Date();
              user.subscriptionExpireDate = new Date(
                new Date().setMonth(new Date().getMonth() + 1)
              );
              await user.save();
            }
          }

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

        console.warn(`❌ Subscription payment failed: Payment ${payment._id}`);
        break;
      }

      // Checkout session expired
      case "checkout.session.expired": {
        const session = event.data.object;
        const { paymentId } = session.metadata;

        const payment = await Payment.findById(paymentId);
        if (!payment || payment.status !== "Pending") return;

        payment.status = "Expired";
        await payment.save();

        console.log(`⚠️ Subscription checkout expired: Payment ${paymentId}`);
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

        // Optionally deactivate subscription
        if (payment.type === "subscription") {
          const user = await User.findById(payment.customerId);
          if (user) {
            user.hasActiveSubscription = false;
            user.subscriptionStartDate = null;
            user.subscriptionExpireDate = null;
            user.subscription = {};
            await user.save();
          }
        }

        console.log(`🔄 Subscription payment refunded: Payment ${payment._id}`);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled subscription event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`❌ Error handling subscription Stripe event ${event.type}:`, err);
  }
};
