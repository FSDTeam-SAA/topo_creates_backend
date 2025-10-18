// handlers/stripeAccountHandlers.js
import User from "../../auth/auth.model.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-01-27.acacia", 
});

// Shared helper to fetch latest account details & update user
const updateUserFromStripe = async (stripeAccountId) => {
  if (!stripeAccountId) {
    console.warn("[Stripe] Missing Stripe Account ID.");
    return;
  }

  try {
    // Always fetch fresh data — webhook payload may be partial
    const account = await stripe.accounts.retrieve(stripeAccountId);

    const user = await User.findOne({ stripeAccountId });
    if (!user) {
      console.warn(`[Stripe] No user found for account ${stripeAccountId}`);
      return;
    }

    // Update relevant fields (idempotent updates — overwrite with latest truth)
    user.detailsSubmitted = Boolean(account.details_submitted);
    user.chargesEnabled = Boolean(account.charges_enabled);
    user.payoutsEnabled = Boolean(account.payouts_enabled);

    // Flag onboarding complete only if both payouts and charges are enabled
    user.stripeOnboardingCompleted =
      account.charges_enabled && account.payouts_enabled;

    // Optional: Save raw Stripe account object for debugging
    user.stripeAccountData = account;

    await user.save();

    console.log(
      `[Stripe] Updated user ${user.email} for account ${stripeAccountId}`
    );
  } catch (error) {
    console.error(
      `[Stripe] Failed to update user for account ${stripeAccountId}:`,
      error
    );
  }
};

// Export event handlers for use in webhook switch
export default {
  // Connected account profile changes
  "account.updated": async (accountObject, connectedAccountId) => {
    await updateUserFromStripe(connectedAccountId || accountObject.id);
  },

  // Capability changes (e.g., payouts enabled)
  "capability.updated": async (capabilityObject, connectedAccountId) => {
    await updateUserFromStripe(connectedAccountId);
  },
};
