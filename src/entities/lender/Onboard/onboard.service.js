import Stripe from 'stripe';


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export async function createConnectedAccount(email) {
  const account = await stripe.accounts.create({
    type: 'express',
    country: 'AU',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });

  return account;
}

export async function createOnboardingLink(accountId, refreshUrl, returnUrl) {
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: 'account_onboarding',
    refresh_url: refreshUrl,
    return_url: returnUrl,
  });

  return link.url;
}

export async function retrieveStripeAccount(accountId) {
  return await stripe.accounts.retrieve(accountId);
}



export const createStripeLoginLink = async (stripeAccountId, redirectUrl) => {
  if (!stripeAccountId) {
    throw new Error("Missing Stripe Account ID");
  }

  const loginLink = await stripe.accounts.createLoginLink(stripeAccountId, {
    redirect_url: redirectUrl, 
  });

  return loginLink.url;
};