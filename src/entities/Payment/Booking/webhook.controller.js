import mongoose from 'mongoose';
import { sendEmail } from '../../../lib/resendEmial.js';
import User from '../../auth/auth.model.js';
import { Booking } from '../../booking/booking.model.js';
import { ChatRoom } from '../../message/chatRoom.model.js';
import Payment from './payment.model.js';

/**
 * Handle Stripe webhook events for booking payments
 */

export const handleBookingPaymentEvents = async (event) => {
  try {
    switch (event.type) {
      // Payment completed successfully via checkout
      case 'checkout.session.completed': {
        const session = event.data.object;
        const { paymentId, bookingId } = session.metadata;

        const payment = await Payment.findById(paymentId);
        if (!payment) return console.warn(`Payment not found: ${paymentId}`);
        if (payment.status === 'Paid') return; // already handled

        // Update Payment
        payment.status = 'Paid';
        payment.stripe.paymentIntentId = session.payment_intent;
        await payment.save();

        // Update Booking
        // Update Booking (atomic update instead of save())
        const booking = await Booking.findByIdAndUpdate(
          bookingId,
          { paymentStatus: 'Paid' },
          { new: true }
        ).populate('customer');

        console.log(
          `Checkout session completed: Payment ${paymentId}, Booking ${bookingId}`
        );

        // Create ChatRoom if not exists, include both customer and lender
        let chatRoom = await ChatRoom.findOne({ bookingId });
        if (!chatRoom) {
          chatRoom = await ChatRoom.create({
            bookingId,
            participants: [booking.customer._id, booking.lender._id],
            createdBy: booking.customer._id
          });
          console.log(
            `ChatRoom created for booking ${bookingId} with participants [${booking.customer._id}, ${booking.lender._id}]`
          );
        } else {
          // ensure both are in participants even if room already exists
          const updated = await ChatRoom.findByIdAndUpdate(
            chatRoom._id,
            {
              $addToSet: {
                participants: {
                  $each: [booking.customer._id, booking.lender._id]
                }
              }
            },
            { new: true }
          );
          chatRoom = updated;
          console.log(
            `ChatRoom already exists, ensured participants [${booking.customer._id}, ${booking.lender._id}]`
          );
        }

        // Send email alerts to admins who opted in
        const adminsToNotify = await User.find({
          role: 'ADMIN',
          'notificationPreferences.receiveEmailAlertsForNewOrders': {
            $exists: true,
            $eq: true
          }
        }).select('email lastName notificationPreferences');

        if (adminsToNotify.length > 0) {
          const subject = '📦 New Order Received';

          const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <!-- Header -->
          <div style="background-color: #4CAF50; color: white; padding: 16px; text-align: center;">
            <h2 style="margin: 0;">New Order Notification</h2>
          </div>

          <!-- Body -->
          <div style="padding: 20px; color: #333; line-height: 1.6;">
            <p style="font-size: 16px;">Hello Admin,</p>
            <p style="font-size: 15px;">A new order has been placed and payment completed successfully. 🎉</p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Booking ID</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${bookingId}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Customer Name</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${booking?.customer?.lastName || 'Unknown'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Customer Email</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${booking?.customer?.email || 'Unknown'}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;"><strong>Payment ID</strong></td>
                <td style="padding: 8px; border: 1px solid #ddd;">${paymentId}</td>
              </tr>
            </table>
          </div>

          <!-- Footer -->
          <div style="background-color: #f4f4f4; padding: 12px; text-align: center; font-size: 12px; color: #666;">
            <p style="margin: 0;">This is an automated notification. Please do not reply.</p>
          </div>
        </div>
        `;

          // Send email to each admin
          await Promise.all(
            adminsToNotify.map((admin) =>
              sendEmail({ to: admin.email, subject, html })
            )
          );

          console.log(
            `📧 Email sent to ${adminsToNotify.length} admin(s) about new order`
          );
        }

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

        const booking = await Booking.findById(payment.bookingId);
        if (booking) booking.paymentStatus = 'Failed';
        await booking.save();

        console.warn(`❌ Payment failed: Payment ${payment._id}`);
        break;
      }

      // Checkout session expired
      case 'checkout.session.expired': {
        const session = event.data.object;
        const { paymentId, bookingId } = session.metadata;

        const payment = await Payment.findById(paymentId);
        if (!payment) return;
        if (payment.status !== 'Pending') return;

        payment.status = 'Expired';
        await payment.save();

        const booking = await Booking.findById(bookingId);
        if (booking) booking.paymentStatus = 'Expired';
        await booking.save();

        console.log(
          `⚠️ Checkout session expired: Payment ${paymentId}, Booking ${bookingId}`
        );
        break;
      }

      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`❌ Error handling Stripe event ${event.type}:`, err);
  }
};

// Payment/Booking/refund.handler.js

export const handleBookingRefundEvents = async (
  event,
  processedByUserId = null,
  refundAmountInput = null
) => {
  try {
    // 1️⃣ Safe extraction of the charge object
    const charge = event?.data?.object;
    if (!charge) {
      console.warn('⚠️ Stripe refund event missing data.object');
      return;
    }

    // 2️⃣ Find booking using the Payment Intent ID
    const booking = await Booking.findOne({
      stripePaymentIntentId: charge.payment_intent
    });
    if (!booking) {
      console.warn(
        `Booking not found for PaymentIntent ${charge.payment_intent}`
      );
      return;
    }

    // 3️⃣ Determine refund amount
    const refundedAmount =
      refundAmountInput != null
        ? refundAmountInput
        : charge.amount_refunded / 100 || booking.totalAmount;

    const totalAmount = booking.totalAmount || 0;
    const refundType = refundedAmount >= totalAmount ? 'Full' : 'Partial';

    // 4️⃣ Prepare refund record
    const stripeRefundId =
      charge.refunds?.data?.[0]?.id || charge.id || 'unknown';

    const refundRecord = {
      refundType,
      amount: refundedAmount,
      reason: charge.reason || 'Not specified',
      stripeRefundId,
      processedAt: new Date(),
      processedBy: processedByUserId
        ? new mongoose.Types.ObjectId(processedByUserId)
        : null,
      status: 'Completed'
    };

    booking.refundDetails.push(refundRecord);

    // 5️⃣ Update booking paymentStatus
    booking.paymentStatus =
      refundType === 'Full' ? 'Refunded' : 'PartiallyRefunded';

    // 6️⃣ Update lenderPrice based on original booking.lenderPrice
    if (refundType === 'Partial') {
      booking.lenderPrice = Math.max(
        (booking.lenderPrice || booking.allocatedLender?.price || 0) -
          refundedAmount,
        0
      );
    } else {
      booking.lenderPrice = 0; // Full refund
    }

    await booking.save();

    console.log(
      `✅ Booking ${booking._id} refund processed: ${refundedAmount} AUD, paymentStatus: ${booking.paymentStatus}, lenderPrice: ${booking.lenderPrice}`
    );
  } catch (err) {
    console.error('❌ Error handling booking refund event:', err.message);
  }
};

// export const handleBookingPaymentEvents = async (event) => {
//   try {
//     switch (event.type) {
//       // Payment completed successfully via checkout
//       case "checkout.session.completed": {
//         const session = event.data.object;
//         const { paymentId, bookingId } = session.metadata;

//         const payment = await Payment.findById(paymentId);
//         if (!payment) return console.warn(`Payment not found: ${paymentId}`);
//         if (payment.status === "Paid") return; // already handled

//         // Update Payment
//         payment.status = "Paid";
//         payment.stripe.paymentIntentId = session.payment_intent;
//         await payment.save();

//         // Update Booking
//         const booking = await Booking.findById(bookingId);
//         if (booking) booking.paymentStatus = "Paid";
//         await booking.save();

//         console.log(`✅ Checkout session completed: Payment ${paymentId}, Booking ${bookingId}`);
//         break;
//       }

//       // Extra safety: payment intent succeeded
//       case "payment_intent.succeeded": {
//         const paymentIntent = event.data.object;
//         const payment = await Payment.findOne({ "stripe.paymentIntentId": paymentIntent.id });
//         if (!payment) return;

//         if (payment.status !== "Paid") {
//           payment.status = "Paid";
//           await payment.save();
//           console.log(`✅ PaymentIntent succeeded: Payment ${payment._id}`);
//         }
//         break;
//       }

//       // Payment failed
//       case "payment_intent.payment_failed": {
//         const paymentIntent = event.data.object;
//         const payment = await Payment.findOne({ "stripe.paymentIntentId": paymentIntent.id });
//         if (!payment) return;

//         payment.status = "Failed";
//         await payment.save();

//         const booking = await Booking.findById(payment.bookingId);
//         if (booking) booking.paymentStatus = "Failed";
//         await booking.save();

//         console.warn(`❌ Payment failed: Payment ${payment._id}`);
//         break;
//       }

//       // Checkout session expired
//       case "checkout.session.expired": {
//         const session = event.data.object;
//         const { paymentId, bookingId } = session.metadata;

//         const payment = await Payment.findById(paymentId);
//         if (!payment) return;
//         if (payment.status !== "Pending") return; // already handled

//         payment.status = "Expired";
//         await payment.save();

//         const booking = await Booking.findById(bookingId);
//         if (booking) booking.paymentStatus = "Expired";
//         await booking.save();

//         console.log(`⚠️ Checkout session expired: Payment ${paymentId}, Booking ${bookingId}`);
//         break;
//       }

//       // Refund happened
//       case "charge.refunded": {
//         const charge = event.data.object;
//         const payment = await Payment.findOne({ "stripe.paymentIntentId": charge.payment_intent });
//         if (!payment) return;

//         payment.status = "Refunded";
//         payment.refundDetails.push({
//           refundId: charge.refunds.data[0]?.id || "unknown",
//           amount: charge.amount_refunded / 100,
//         });
//         await payment.save();

//         const booking = await Booking.findById(payment.bookingId);
//         if (booking) booking.paymentStatus = "Refunded";
//         await booking.save();

//         console.log(`🔄 Payment refunded: Payment ${payment._id}`);
//         break;
//       }

//       default:
//         console.log(`ℹ️ Unhandled event type: ${event.type}`);
//     }
//   } catch (err) {
//     console.error(`❌ Error handling Stripe event ${event.type}:`, err);
//   }
// };
