import cron from "node-cron";
import User from "../entities/auth/auth.model.js";
import { Booking } from "../entities/booking/booking.model.js";
import sendEmail from "./sendEmail.js";


export const startReminderJob = () => {
  // Runs every day at 9 AM
  cron.schedule("0 9 * * *", async () => {
    try {
      console.log("[ReminderJob] Running...");

      // 1. Check if feature is enabled by any admin
      const adminEnabled = await User.exists({
        role: "ADMIN",
        "notificationPreferences.sendRemindersForReturnDeadlines": true,
      });

      if (!adminEnabled) {
        console.log("[ReminderJob] Disabled by all admins. Skipping.");
        return;
      }

      // 2. Find bookings due today (and already paid)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);

      const bookings = await Booking.find({
        rentalEndDate: { $gte: today, $lt: tomorrow },
        paymentStatus: "Paid",
      }).populate("customer", "email fullName");

      if (!bookings.length) {
        console.log("[ReminderJob] No bookings due today.");
        return;
      }

      // 3. Send reminder to each booking's customer
      for (const booking of bookings) {
        if (!booking.customer || !booking.customer.email) {
          console.warn(`[ReminderJob] Skipping booking ${booking._id}, customer has no email.`);
          continue;
        }

        const html = `
          <p>Hi ${booking.customer.fullName || "Customer"},</p>
          <p>This is a friendly reminder that your rental for 
          <b>${booking.dressId}</b> ends on <b>${booking.rentalEndDate.toDateString()}</b>.</p>
          <p>Please make sure to return the dress on time to avoid late fees.</p>
          <p>Thank you for using our service!</p>
        `;

        await sendEmail({
          to: booking.customer.email,
          subject: "Return Reminder - Rental Dress",
          html,
        });

        console.log(`[ReminderJob] Email sent to ${booking.customer.email}`);
      }
    } catch (err) {
      console.error("[ReminderJob] Error:", err);
    }
  });
};
