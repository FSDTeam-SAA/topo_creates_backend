import Stripe from 'stripe';
import SubscriptionPlan from '../../subscription/subscription.model.js';
import { sendEmail } from '../../../lib/resendEmial.js';
import {
  subscriptionActivatedTemplate,
  subscriptionPaymentConfirmationTemplate
} from '../../../lib/emailTemplates/subscription.templates.js';
import User from '../../auth/auth.model.js';
import Payment from '../Booking/payment.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

export const payForSubscription = async (req, res) => {
  try {
    const { planId } = req.params;
    const userId = req.user._id;

    // ✅ Check role
    if (req.user.role !== 'LENDER') {
      return res
        .status(403)
        .json({ status: false, message: 'Only lenders can subscribe' });
    }

    // ✅ Fetch plan
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return res.status(404).json({ status: false, message: 'Plan not found' });
    }

    // ✅ If FREE plan (price = 0) → activate immediately
    if (plan.price === 0) {
      const user = await User.findById(userId);
      user.hasActiveSubscription = true;
      user.subscriptionStartDate = new Date();
      let durationDays;
      switch (plan.billingCycle) {
        case 'monthly':
          durationDays = 30;
          break;
        case 'quarterly':
          durationDays = 90;
          break;
        case 'yearly':
          durationDays = 365;
          break;
        default:
          durationDays = 30;
      }

      user.subscriptionExpireDate = new Date(
        Date.now() + durationDays * 24 * 60 * 60 * 1000
      );
      user.subscription.planId = plan._id;
      await user.save();

      const payment = await Payment.create({
        type: 'subscription',
        subscription: { planId: plan._id },
        customerId: userId,
        amount: 0,
        currency: plan.currency,
        status: 'Paid'
      });

      // Send activation email
      try {
        await sendEmail({
          to: user.email,
          subject: `Welcome to ${plan.name}!`,
          html: subscriptionActivatedTemplate(
            user.firstName || 'Lender',
            plan.name,
            0,
            plan.currency,
            plan.billingCycle,
            new Date(
              Date.now() + (plan.durationDays || 30) * 24 * 60 * 60 * 1000
            ),
            plan.features || []
          )
        });
      } catch (emailError) {
        console.error(
          'Failed to send free subscription activation email:',
          emailError
        );
      }

      return res.status(200).json({
        status: true,
        message: 'Free subscription activated',
        data: { plan, payment }
      });
    }

    // ✅ Paid plan → create payment record first
    const payment = await Payment.create({
      type: 'subscription',
      subscription: { planId: plan._id },
      customerId: userId,
      amount: plan.price,
      currency: plan.currency,
      status: 'Pending'
    });

    // ✅ Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: plan.currency.toLowerCase(),
            product_data: { name: plan.name },
            unit_amount: plan.price * 100 // cents
          },
          quantity: 1
        }
      ],
      metadata: {
        paymentId: payment._id.toString(),
        planId: plan._id.toString(),
        customerId: userId.toString()
      },
      success_url: `${process.env.FRONTEND_URL}/subscription/success`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`
    });

    // ✅ Save checkoutSessionId
    payment.stripe = { checkoutSessionId: session.id };
    await payment.save();

    // Note: Confirmation email will be sent by webhook after successful payment

    return res.status(200).json({
      status: true,
      message: 'Checkout session created',
      data: { checkoutUrl: session.url }
    });
  } catch (err) {
    console.error('❌ Subscription payment error:', err);
    res.status(500).json({ status: false, message: err.message });
  }
};
