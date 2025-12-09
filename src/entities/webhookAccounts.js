import Stripe from 'stripe';
import stripeAccountHandlers from './lender/Onboard/accountWebhook.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia',
});

export const connectedAccountWebhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET_CONNECTED;

  let event;
  try {
    
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('✅ Webhook signature verified:', event.type);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const { type, data, account: connectedAccountId } = event;

  try {
    // If event is from a connected account, handle with stripeAccountHandlers
    if (connectedAccountId && stripeAccountHandlers[type]) {
      await stripeAccountHandlers[type](data.object, connectedAccountId);
      console.log(`[Stripe] Handled connected account event: ${type}`);
    }
    // Else, handle platform payment events
    else if (!connectedAccountId && stripeWebhookHandlers[type]) {
      await stripeWebhookHandlers[type](data.object);
      console.log(`[Stripe] Handled platform event: ${type}`);
    } else {
      console.log(`[Stripe] No handler for event type: ${type}`);
    }

    // Acknowledge receipt
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error handling webhook event:', error);
    res.status(500).send('Internal Server Error');
  }
};
