
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createOrReuseVerificationSession = async (user) => {
  const now = new Date();

  // If user has a stored session that is not expired and status allows resuming
  if (
    user.stripeVerificationSessionUrl &&
    user.stripeVerificationSessionExpiresAt &&
    user.stripeVerificationSessionExpiresAt > now &&
    ['requires_input', 'processing', 'pending'].includes(user.kycStatus) &&
    !user.kycVerified
  ) {
    // Reuse existing session URL
    return {
      url: user.stripeVerificationSessionUrl,
      reused: true,
    };
  }

  // Otherwise create a new verification session
  const session = await stripe.identity.verificationSessions.create({
    type: 'document',
    options: {
      document: {
        allowed_types: ['passport', 'driving_license', 'national_id'],
      },
    },
    metadata: {
      userId: user._id.toString(),
    },
  });

  // Save new session info on user
  user.stripeVerificationSessionId = session.id;
  user.stripeVerificationSessionUrl = session.url;
  user.stripeVerificationSessionExpiresAt = new Date(session.expires_at * 1000);
  user.kycStatus = 'pending';
  user.kycVerified = false;
  user.kycLastUpdated = now;
  user.kycDetails = null; // clear previous details if any
  await user.save();

  return {
    url: session.url,
    reused: false,
  };
};
