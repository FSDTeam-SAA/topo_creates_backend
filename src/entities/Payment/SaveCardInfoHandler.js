import mongoose from "mongoose";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleSetupIntentCompleted = async (event) => {
  try {
    const setupIntentId = event.data.object.id;
    const setupIntent = event.data.object;

    const customerId = setupIntent.customer;
    const paymentMethodId = setupIntent.payment_method;

    if (!paymentMethodId) {
      console.warn("SetupIntent has no payment method");
      return;
    }

    // Retrieve the Stripe customer to get metadata.userId
    const customer = await stripe.customers.retrieve(customerId);
    const userId = customer.metadata?.userId;

    if (!userId) {
      console.warn("User ID not found in customer metadata for SetupIntent");
      return;
    }

    const User = mongoose.model("User");

    const user = await User.findById(userId);
    if (!user) {
      console.warn("User not found for SetupIntent");
      return;
    }

    // Save card for future usage
    user.defaultPaymentMethodId = paymentMethodId;
    user.stripeCustomerId = customerId;
    await user.save();

    console.log(`✅ Saved payment method for user ${userId}`);

  } catch (err) {
    console.error("❌ Error handling setup_intent.succeeded:", err);
  }
};
