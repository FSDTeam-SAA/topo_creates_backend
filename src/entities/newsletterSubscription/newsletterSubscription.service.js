import NewsletterSubscription from './newsletterSubscription.model.js';
import { sendEmail } from '../../lib/resendEmial.js';
import { adminEmail } from '../../core/config/config.js';

export const createNewsletterSubscriptionService = async (email) => {
  const existingSubscription = await NewsletterSubscription.findOne({ email });
  if (existingSubscription)
    throw new Error('Email already subscribed to the newsletter');

  const newsletterSubscription = new NewsletterSubscription({ email });

  await newsletterSubscription.save();

  const emailTasks = [];

  if (adminEmail) {
    emailTasks.push(
      sendEmail({
        to: adminEmail,
        subject: 'New Newsletter Subscription',
        html: `
                    <h2>New Newsletter Subscriber</h2>
                    <p>A new user has subscribed to the newsletter.</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <br/>
                    <p>Regards,<br/>Topo Creates Team</p>
                `
      })
    );
  }

  emailTasks.push(
    sendEmail({
      to: email,
      subject: 'Newsletter Subscription Confirmed',
      html: `
                <h2>Thanks for subscribing!</h2>
                <p>You are now subscribed to the Muse Gala.</p>
                <p>We will keep you updated with the latest news and offers.</p>
                <br/>
                <p>Regards,<br/>Muse Gala</p>
            `
    })
  );

  await Promise.all(emailTasks);
  return;
};

export const getAllNewsletterSubscriptionService = async (
  page,
  limit,
  skip
) => {
  const newsletterSubscriptions = await NewsletterSubscription.find({})
    .sort({ subscribedAt: -1 })
    .lean();
  return {
    data: newsletterSubscriptions.slice(skip, skip + limit),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(newsletterSubscriptions.length / limit),
      totalItems: newsletterSubscriptions.length,
      itemsPerPage: limit
    }
  };
};
