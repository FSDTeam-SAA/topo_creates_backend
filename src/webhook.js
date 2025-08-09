import Stripe from 'stripe';
import { generateResponse } from './lib/responseFormate.js';
import accountHandlers from './entities/lender/Onboard/accountWebhook.js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return generateResponse(res, 400, false, `Webhook error: ${err.message}`);
  }

  try {
    const { type, data } = event;

    if (accountHandlers[type]) {
      await accountHandlers[type](data.object);
    } else {
      console.log(`Unhandled Stripe event type: ${type}`);
    }

    return generateResponse(res, 200, true, 'Webhook received');
  } catch (error) {
    console.error('Error processing webhook:', error);
    return generateResponse(res, 500, false, 'Webhook processing failed');
  }
};
