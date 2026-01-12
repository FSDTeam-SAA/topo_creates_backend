import Stripe from 'stripe';
import { sendEmail } from '../../../lib/resendEmial.js';
import {
  subscriptionActivatedTemplate,
  subscriptionPaymentConfirmationTemplate,
  subscriptionPaymentFailedTemplate,
  subscriptionCheckoutExpiredTemplate,
  subscriptionRefundedTemplate
} from '../../../lib/emailTemplates/subscription.templates.js';

import User from '../../auth/auth.model.js';
import Payment from '../Booking/payment.model.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16'
});

/**
 * Handle Stripe webhook events for subscription payments
 */
export const handleSubscriptionPaymentEvents = async (event) => {
  try {
    switch (event.type) {
      // Payment completed successfully via checkout
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { paymentId, planId, customerId } = session.metadata;

        const payment = await Payment.findById(paymentId);
        if (!payment) return console.warn(`Payment not found: ${paymentId}`);
        if (payment.status === 'Paid') return; // already handled

        // Update Payment
        payment.status = 'Paid';
        payment.stripe.paymentIntentId = session.payment_intent;
        await payment.save();

        // Update User subscription
        const user = await User.findById(customerId);
        if (!user) return;

        user.hasActiveSubscription = true;
        user.subscriptionStartDate = new Date();
        user.subscriptionExpireDate = new Date(
          new Date().setMonth(new Date().getMonth() + 1)
        );
        user.subscription = { planId };
        await user.save();

        // Fetch plan for email
        const plan = await (
          await import('../../subscription/subscription.model.js')
        ).default.findById(planId);

        // Send payment confirmation email
        try {
          await sendEmail({
            to: user.email,
            subject: `Payment Confirmed - ${plan?.name || 'Subscription'}`,
            html: subscriptionPaymentConfirmationTemplate(
              user.firstName || 'Lender',
              plan?.name || 'Subscription',
              plan?.price || payment.amount,
              plan?.currency || payment.currency,
              payment._id,
              new Date()
            )
          });
        } catch (emailError) {
          console.error(
            'Failed to send subscription payment confirmation email:',
            emailError
          );
        }

        // Send activation email
        try {
          await sendEmail({
            to: user.email,
            subject: `Welcome to ${plan?.name || 'Subscription'}!`,
            html: subscriptionActivatedTemplate(
              user.firstName || 'Lender',
              plan?.name || 'Subscription',
              plan?.price || payment.amount,
              plan?.currency || payment.currency,
              plan?.billingCycle || 'monthly',
              user.subscriptionExpireDate,
              plan?.features || []
            )
          });
        } catch (emailError) {
          console.error(
            'Failed to send subscription activation email:',
            emailError
          );
        }

        console.log(
          `✅ Subscription checkout completed: Payment ${paymentId}, User ${customerId}`
        );
        break;
      }

      // Extra safety: payment intent succeeded
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const payment = await Payment.findOne({
          'stripe.paymentIntentId': paymentIntent.id
        });
        if (!payment) return;

        if (payment.status !== 'Paid') {
          payment.status = 'Paid';
          await payment.save();

          // Update User subscription if not already done
          if (payment.type === 'subscription' && payment.subscription?.planId) {
            const user = await User.findById(payment.customerId);
            if (user) {
              user.hasActiveSubscription = true;
              user.subscriptionStartDate = new Date();
              user.subscriptionExpireDate = new Date(
                new Date().setMonth(new Date().getMonth() + 1)
              );
              await user.save();
            }
          }

          console.log(`✅ PaymentIntent succeeded: Payment ${payment._id}`);
        }
        break;
      }

      // Payment failed
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const payment = await Payment.findOne({
          'stripe.paymentIntentId': paymentIntent.id
        });
        if (!payment) return;

        payment.status = 'Failed';
        await payment.save();

        // Send failure email to customer
        const user = await User.findById(payment.customerId);
        if (user) {
          try {
            const plan = await (
              await import('../../subscription/subscription.model.js')
            ).default.findById(payment.subscription?.planId);
            await sendEmail({
              to: user.email,
              subject: 'Subscription Payment Failed',
              html: subscriptionPaymentFailedTemplate(
                user.firstName || 'Lender',
                plan?.name || 'Subscription',
                payment.amount,
                payment.currency,
                paymentIntent.last_payment_error?.message ||
                  'Payment could not be processed. Please try again.'
              )
            });
          } catch (emailError) {
            console.error(
              'Failed to send subscription payment failure email:',
              emailError
            );
          }
        }

        console.warn(`❌ Subscription payment failed: Payment ${payment._id}`);
        break;
      }

      // Checkout session expired
      case 'checkout.session.expired': {
        const session = event.data.object;
        const { paymentId } = session.metadata;

        const payment = await Payment.findById(paymentId);
        if (!payment || payment.status !== 'Pending') return;

        payment.status = 'Expired';
        await payment.save();

        // Send expiration email to customer
        const user = await User.findById(payment.customerId);
        if (user) {
          try {
            const plan = await (
              await import('../../subscription/subscription.model.js')
            ).default.findById(payment.subscription?.planId);
            await sendEmail({
              to: user.email,
              subject: 'Your Subscription Checkout Has Expired',
              html: subscriptionCheckoutExpiredTemplate(
                user.firstName || 'Lender',
                plan?.name || 'Subscription',
                payment.amount,
                payment.currency
              )
            });
          } catch (emailError) {
            console.error('Failed to send checkout expired email:', emailError);
          }
        }

        console.log(`⚠️ Subscription checkout expired: Payment ${paymentId}`);
        break;
      }

      // Refund happened
      case 'charge.refunded': {
        const charge = event.data.object;
        const payment = await Payment.findOne({
          'stripe.paymentIntentId': charge.payment_intent
        });
        if (!payment) return;

        const refundAmount = charge.amount_refunded / 100;
        const refundId = charge.refunds.data[0]?.id || 'unknown';

        payment.status = 'Refunded';
        payment.refundDetails.push({
          refundId: refundId,
          amount: refundAmount
        });
        await payment.save();

        // Optionally deactivate subscription
        if (payment.type === 'subscription') {
          const user = await User.findById(payment.customerId);
          if (user) {
            user.hasActiveSubscription = false;
            user.subscriptionStartDate = null;
            user.subscriptionExpireDate = null;
            user.subscription = {};
            await user.save();

            // Send refund email
            try {
              const plan = await (
                await import('../../subscription/subscription.model.js')
              ).default.findById(payment.subscription?.planId);
              await sendEmail({
                to: user.email,
                subject: 'Subscription Refunded',
                html: subscriptionRefundedTemplate(
                  user.firstName || 'Lender',
                  plan?.name || 'Subscription',
                  refundAmount,
                  payment.currency,
                  refundId
                )
              });
            } catch (emailError) {
              console.error(
                'Failed to send subscription refund email:',
                emailError
              );
            }
          }
        }

        console.log(`🔄 Subscription payment refunded: Payment ${payment._id}`);
        break;
      }

      default:
        console.log(`ℹ️ Unhandled subscription event type: ${event.type}`);
    }
  } catch (err) {
    console.error(
      `❌ Error handling subscription Stripe event ${event.type}:`,
      err
    );
  }
};
