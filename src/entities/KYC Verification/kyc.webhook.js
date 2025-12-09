
import User from '../auth/auth.model.js';

export const handleVerificationSessionEvent = async (event) => {
  const session = event.data.object;
  const userId = session.metadata.userId;
  if (!userId) {
    console.warn('Verification session missing userId metadata');
    return;
  }

  const user = await User.findById(userId);
  if (!user) {
    console.warn(`User not found for ID ${userId}`);
    return;
  }

  const now = new Date();

  switch (event.type) {
    case 'identity.verification_session.verified':
      user.kycVerified = true;
      user.kycStatus = 'verified';
      user.kycLastUpdated = now;
      user.kycDetails = session;

      // Clear session info since verification is done
      user.stripeVerificationSessionId = null;
      user.stripeVerificationSessionUrl = null;
      user.stripeVerificationSessionExpiresAt = null;
      break;

    case 'identity.verification_session.requires_input':
      user.kycVerified = false;
      user.kycStatus = 'requires_input';
      user.kycLastUpdated = now;
      user.kycDetails = session;
      // Keep session info so user can resume
      break;

    case 'identity.verification_session.processing':
      user.kycVerified = false;
      user.kycStatus = 'pending';
      user.kycLastUpdated = now;
      user.kycDetails = session;
      // Keep session info so user can resume
      break;

    case 'identity.verification_session.canceled':
    case 'identity.verification_session.expired':
      user.kycVerified = false;
      user.kycStatus = 'failed';
      user.kycLastUpdated = now;
      user.kycDetails = session;

      // Clear session info to force new session next time
      user.stripeVerificationSessionId = null;
      user.stripeVerificationSessionUrl = null;
      user.stripeVerificationSessionExpiresAt = null;
      break;

    default:
      // ignore other events
      return;
  }

  await user.save();
};
