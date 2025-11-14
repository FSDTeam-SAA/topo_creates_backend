import mongoose from "mongoose";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);




export const handleSetupIntentCompleted = async (event) => {
  try {
    // Extract SetupIntent object
    const setupIntent = event.data.object;

    const customerId = setupIntent.customer;
    const paymentMethodId = setupIntent.payment_method;

    if (!customerId || !paymentMethodId) {
      console.warn("SetupIntent missing customer or payment method");
      return;
    }

    // Retrieve Stripe customer to get metadata
    const customer = await stripe.customers.retrieve(customerId);
    const userId = customer.metadata?.userId;

    if (!userId) {
      console.warn(`User ID not found in Stripe customer metadata (customerId: ${customerId})`);
      return;
    }

    // Retrieve Mongoose User model
    const User = mongoose.model("User");

    const user = await User.findById(userId);
    if (!user) {
      console.warn(`User not found in DB for userId: ${userId}`);
      return;
    }

    // Save/update Stripe customer ID and default payment method
    user.stripeCustomerId = customerId;
    user.defaultPaymentMethodId = paymentMethodId;

 

    await user.save();

    console.log(`✅ Saved payment method (${paymentMethodId}) for user ${userId}`);

  } catch (err) {
    console.error("❌ Error handling setup_intent.succeeded:", err);
  }
};
