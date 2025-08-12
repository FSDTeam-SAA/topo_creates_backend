import Stripe from 'stripe';
import { handleVerificationSessionEvent } from './KYC Verification/kyc.webhook.js';

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
    // Process only relevant identity events
    switch (event.type) {
      case 'identity.verification_session.created':
      case 'identity.verification_session.requires_input':
      case 'identity.verification_session.processing':
      case 'identity.verification_session.verified':
      case 'identity.verification_session.canceled':
      case 'identity.verification_session.expired':
        await handleVerificationSessionEvent(event);
        break;
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    // Respond immediately to acknowledge receipt
    res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Error processing event:', err);
    res.status(500).send('Webhook handler error');
  }

 
};
