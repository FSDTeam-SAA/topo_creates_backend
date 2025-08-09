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


