
import {
  createConnectedAccount,
  createOnboardingLink,
  createStripeLoginLink,
  retrieveStripeAccount,
} from '../Onboard/onboard.service.js';
import User from '../../auth/auth.model.js';
import RoleType from '../../../lib/types.js';
import { generateResponse } from '../../../lib/responseFormate.js';


export const onboardLender = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return generateResponse(res, 400, false, 'Email is required.');
    }

    const lender = await User.findOne({ email, role: RoleType.LENDER });

    if (!lender) {
      return generateResponse(res, 404, false, 'Lender not found or unauthorized.');
    }

      if (lender.stripeOnboardingCompleted) {
      return generateResponse(res, 200, true, 'Stripe onboarding already completed.');
    }


    if (!lender.stripeAccountId) {
      const account = await createConnectedAccount(email);

      lender.stripeAccountId = account.id;
      lender.detailsSubmitted = account.details_submitted;
      lender.chargesEnabled = account.charges_enabled;
      lender.payoutsEnabled = account.payouts_enabled;
      lender.stripeOnboardingCompleted = account.charges_enabled && account.payouts_enabled;

      await lender.save();
    }

    const onboardingUrl = await createOnboardingLink(
      lender.stripeAccountId,
      `${process.env.FRONTEND_URL}/stripe/refresh`,
      `${process.env.FRONTEND_URL}/stripe/return`
    );

    return generateResponse(res, 200, true, 'Onboarding link created successfully', { url: onboardingUrl });
  } catch (error) {
    console.error('Onboarding error:', error);
    return generateResponse(res, 500, false, 'Error during onboarding', error.message);
  }
};

export const refreshStripeAccountStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user?.stripeAccountId) {
      return generateResponse(res, 404, false, 'Stripe account not found.');
    }

    const account = await retrieveStripeAccount(user.stripeAccountId);
    // console.log('Stripe account retrieved:', account);

    user.detailsSubmitted = account.details_submitted;
    user.chargesEnabled = account.charges_enabled;
    user.payoutsEnabled = account.payouts_enabled;
    user.stripeOnboardingCompleted = account.charges_enabled && account.payouts_enabled;

    await user.save();
      const stripeStatus = {
      stripeAccountId: user.stripeAccountId,
      detailsSubmitted: user.detailsSubmitted,
      chargesEnabled: user.chargesEnabled,
      payoutsEnabled: user.payoutsEnabled,
      onboardingCompleted: user.stripeOnboardingCompleted,
    };

    return generateResponse(res, 200, true, 'Account status updated', stripeStatus);
  } catch (err) {
    console.error('Stripe refresh error:', err);
    return generateResponse(res, 500, false, 'Error refreshing account', err.message);
  }
};


export const getStripeLoginLink = async (req, res) => {
  try {
    const  userId  = req.user._id;

    // Find user to get their connected account ID
    const user = await User.findById(userId);
    if (!user || !user.stripeAccountId) {
      return res.status(404).json({ error: "Connected Stripe account not found" });
    }

    const url = await createStripeLoginLink(user.stripeAccountId,
       `${process.env.FRONTEND_URL}/stripe/refresh`
    );

    
    generateResponse(res, 200, true, 'Stripe login link generated successfully', { url });
  } catch (error) {
    console.error("Error generating Stripe login link:", error);
    generateResponse(res, 500, false, 'Failed to generate Stripe login link');
  }
};