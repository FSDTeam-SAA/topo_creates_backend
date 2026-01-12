import User from '../auth/auth.model.js';
import { sendEmail } from '../../lib/resendEmial.js';
import {
  kycVerifiedTemplate,
  kycRequiresInputTemplate,
  kycProcessingTemplate,
  kycFailedTemplate
} from '../../lib/emailTemplates/kyc.templates.js';

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

      // Send verification success email
      try {
        await sendEmail({
          to: user.email,
          subject: 'KYC Verification Successful',
          html: kycVerifiedTemplate(user.firstName || user.lastName || user.username || 'User')
        });
      } catch (emailError) {
        console.error('Error sending KYC verified email:', emailError);
      }
      break;

    case 'identity.verification_session.requires_input':
      user.kycVerified = false;
      user.kycStatus = 'requires_input';
      user.kycLastUpdated = now;
      user.kycDetails = session;
      // Keep session info so user can resume

      // Send requires input email
      try {
        await sendEmail({
          to: user.email,
          subject: 'Additional Information Needed for KYC',
          html: kycRequiresInputTemplate(
            user.firstName || user.lastName || user.username || 'User',
            'Please provide additional documents'
          )
        });
      } catch (emailError) {
        console.error('Error sending KYC requires input email:', emailError);
      }
      break;

    case 'identity.verification_session.processing':
      user.kycVerified = false;
      user.kycStatus = 'pending';
      user.kycLastUpdated = now;
      user.kycDetails = session;
      // Keep session info so user can resume

      // Send processing email
      try {
        await sendEmail({
          to: user.email,
          subject: 'KYC Verification in Progress',
          html: kycProcessingTemplate(user.firstName ||  user.lastName || user.username || 'User')
        });
      } catch (emailError) {
        console.error('Error sending KYC processing email:', emailError);
      }
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

      // Send failed/expired email
      try {
        const reason =
          event.type === 'identity.verification_session.expired'
            ? 'Your verification session has expired'
            : 'Your verification session was canceled';
        await sendEmail({
          to: user.email,
          subject: 'KYC Verification Session Ended',
          html: kycFailedTemplate(user.firstName ||  user.lastName || user.username || 'User', reason)
        });
      } catch (emailError) {
        console.error('Error sending KYC failed email:', emailError);
      }
      break;

    default:
      // ignore other events
      return;
  }

  await user.save();
};
