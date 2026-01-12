import cron from 'node-cron';
import User from '../entities/auth/auth.model.js';
import { Booking } from '../entities/booking/booking.model.js';
import { sendEmail } from './resendEmial.js';

export const startReminderJob = () => {
  // Runs every day at 09:00 AM
  // format : min hour day month day-of-week
  cron.schedule('00 09 * * *', async () => {
    try {
      console.log('[ReminderJob] Running...');

      // 1. Check if feature is enabled by any admin
      const adminEnabled = await User.exists({
        role: 'ADMIN',
        'notificationPreferences.sendRemindersForReturnDeadlines': true
      });

      if (!adminEnabled) {
        console.log('[ReminderJob] Disabled by all admins. Skipping.');
        return;
      }

      // 2. Find bookings due today (and already paid)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const bookings = await Booking.find({
        rentalEndDate: { $gte: today, $lt: tomorrow },
        paymentStatus: 'Paid'
      }).populate('customer', 'email fullName');

      if (!bookings.length) {
        console.log('[ReminderJob] No bookings due today.');
        return;
      }

      // 3. Send reminder to each booking's customer
      for (const booking of bookings) {
        if (!booking.customer || !booking.customer.email) {
          console.warn(
            `[ReminderJob] Skipping booking ${booking._id}, customer has no email.`
          );
          continue;
        }

        const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e2e2; border-radius: 10px; background-color: #fdfdfd;">
            <h2 style="color: #4CAF50; text-align: center;">🕒 Rental Reminder</h2>
            <p>Hi <strong>${booking.customer.fullName || 'Customer'}</strong>,</p>
            <p>This is a friendly reminder that your rental for:</p>
            <p style="text-align: center; font-size: 16px; font-weight: bold; color: #555;">
            ${booking.dressId}
            </p>
            <p>is ending on:</p>
            <p style="text-align: center; font-size: 16px; font-weight: bold; color: #d9534f;">
            ${booking.rentalEndDate.toDateString()}
            </p>
            <p>Please make sure to return the dress on time to avoid any late fees.</p>
            <p style="margin-top: 20px; font-size: 12px; color: #888; text-align: center;">
            Thank you for using our service!<br/>
            <em>Muse Gala platform team</em>
            </p>
        </div>
        `;

        await sendEmail({
          to: booking.customer.email,
          subject: 'Return Reminder - Rental Dress',
          html
        });

        console.log(`[ReminderJob] Email sent to ${booking.customer.email}`);
      }
    } catch (err) {
      console.error('[ReminderJob] Error:', err);
    }
  });
};
