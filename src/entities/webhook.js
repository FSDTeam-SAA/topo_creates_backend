import Stripe from 'stripe';
import { handleVerificationSessionEvent } from './KYC Verification/kyc.webhook.js';
import {
  handleBookingPaymentEvents,
  handleBookingRefundEvents
} from './Payment/Booking/webhook.controller.js';
import { handleSubscriptionPaymentEvents } from './Payment/Subscription/subsPayment.webhook.js';
import Payment from './Payment/Booking/payment.model.js';
import { handleSetupIntentCompleted } from './Payment/SaveCardInfoHandler.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

export const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    // Verify webhook signature using the raw body
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('✅ Webhook signature verified:', event.type);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Map event types to handler functions
    const eventHandlers = {
      // KYC events
      'identity.verification_session.created': handleVerificationSessionEvent,
      'identity.verification_session.requires_input':
        handleVerificationSessionEvent,
      'identity.verification_session.processing':
        handleVerificationSessionEvent,
      'identity.verification_session.verified': handleVerificationSessionEvent,
      'identity.verification_session.canceled': handleVerificationSessionEvent,
      'identity.verification_session.expired': handleVerificationSessionEvent,
      'setup_intent.succeeded': handleSetupIntentCompleted,

      // All payment events (booking or subscription)
      'checkout.session.completed': async (event) => {
        const session = event.data.object;

        // ✅ Extract metadata safely
        const metadata = session.metadata || {};

        // ✅ Case 2: Booking payment (Pay-now flow)
        if (metadata.bookingId) {
          await handleBookingPaymentEvents(event);
          return;
        }

        // ✅ Case 3: Subscription payment
        if (metadata.planId) {
          await handleSubscriptionPaymentEvents(event);
          return;
        }

        // ✅ Default fallback (ignored)
        console.log(`ℹ️ checkout.session.completed but no matching metadata.`);
      },

      'payment_intent.succeeded': async (event) => {
        const payment = await Payment.findOne({
          'stripe.paymentIntentId': event.data.object.id
        });
        if (!payment) return;
        if (payment.bookingId) {
          await handleBookingPaymentEvents(event);
        } else if (payment.subscription?.planId) {
          await handleSubscriptionPaymentEvents(event);
        }
      },
      'payment_intent.payment_failed': async (event) => {
        const payment = await Payment.findOne({
          'stripe.paymentIntentId': event.data.object.id
        });
        if (!payment) return;
        if (payment.bookingId) {
          await handleBookingPaymentEvents(event);
        } else if (payment.subscription?.planId) {
          await handleSubscriptionPaymentEvents(event);
        }
      },
      'checkout.session.expired': async (event) => {
        const metadata = event.data.object.metadata;
        if (metadata.bookingId) {
          await handleBookingPaymentEvents(event);
        } else if (metadata.planId) {
          await handleSubscriptionPaymentEvents(event);
        }
      },
      'charge.refunded': async (event) => {
        try {
          // Directly handle booking refund
          await handleBookingRefundEvents(event);
          console.log('✅ charge.refunded event processed for booking');
        } catch (err) {
          console.error('❌ Error processing charge.refunded:', err);
        }
      }
    };

    // Dispatch to the appropriate handler
    const handler = eventHandlers[event.type];
    if (handler) {
      await handler(event);
      console.log(`✅ Handled Stripe event: ${event.type}`);
    } else {
      console.log(`ℹ️ Unhandled Stripe event type: ${event.type}`);
    }

    // Respond immediately to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Error processing Stripe event:', err);
    res.status(500).send('Webhook handler error');
  }
};
