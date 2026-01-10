import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Generic email sender utility
 */
export const sendEmail = async ({ to, subject, html }) => {
  try {
    const response = await resend.emails.send({
      from:process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });

    return response;
  } catch (error) {
    console.error("Email Sending Error:", error);
    throw new Error("Failed to send email");
  }
};
