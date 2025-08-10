import User from "../../auth/auth.model.js";


export default {
  'account.updated': async (account) => {
    // Find the user with this Stripe account ID
    const user = await User.findOne({ stripeAccountId: account.id });
    if (!user) {
      console.warn(`No user found for Stripe account ${account.id}`);
      return;
    }

    // Update Stripe-related fields
    user.detailsSubmitted = account.details_submitted;
    user.chargesEnabled = account.charges_enabled;
    user.payoutsEnabled = account.payouts_enabled;
    user.stripeOnboardingCompleted = account.charges_enabled && account.payouts_enabled;

    await user.save();

    console.log(`User ${user.email} updated from Stripe webhook`);
  },
}