import Stripe from 'stripe';
import { handleVerificationSessionEvent } from './KYC Verification/kyc.webhook.js';
import { handleBookingPaymentEvents } from './Payment/Booking/webhook.controller.js';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
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
      'identity.verification_session.requires_input': handleVerificationSessionEvent,
      'identity.verification_session.processing': handleVerificationSessionEvent,
      'identity.verification_session.verified': handleVerificationSessionEvent,
      'identity.verification_session.canceled': handleVerificationSessionEvent,
      'identity.verification_session.expired': handleVerificationSessionEvent,

      // Booking payment events
      'checkout.session.completed': handleBookingPaymentEvents,
      'payment_intent.succeeded': handleBookingPaymentEvents,
      'payment_intent.payment_failed': handleBookingPaymentEvents,
      'checkout.session.expired': handleBookingPaymentEvents,
      'charge.refunded': handleBookingPaymentEvents,
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
