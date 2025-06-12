// utils/templates/deactivationOtpEmail.js
export const deactivationOtpEmail = (name, code) => `
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <h2 style="color: #800000;">Account Deactivation Request</h2>
    <p>Hi <strong>${name}</strong>,</p>
    <p>You requested to deactivate your account. To continue, please enter the following verification code:</p>
    <h1 style="letter-spacing: 3px; background: #f2f2f2; padding: 10px; display: inline-block;">${code}</h1>
    <p>This code is valid for the next 10 minutes. Do not share it with anyone.</p>
    <br>
    <p>If you did not initiate this request, please contact our support team immediately.</p>
    <br>
    <p>Thanks,<br>The Support Team</p>
  </div>
`;
