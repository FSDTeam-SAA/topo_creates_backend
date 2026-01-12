// ✅ Dispute Email Templates

export const disputeCreatedTemplate = (userName, issueType, bookingId) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #d32f2f; margin: 10px 0;">Dispute Created</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">A dispute has been created for your booking. Our team will review this matter and provide updates shortly.</p>
    <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 16px; color: #b71c1c; margin: 5px 0;"><strong>Issue Type:</strong> ${issueType}</p>
      <p style="font-size: 16px; color: #b71c1c; margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
      <p style="font-size: 16px; color: #b71c1c; margin: 5px 0;"><strong>Status:</strong> Pending Review</p>
    </div>
    <p style="font-size: 16px; color: #555;">You will receive updates as we progress through the resolution process.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const disputeUnderReviewTemplate = (userName, issueType, bookingId) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #2196F3;">📋</div>
      <h1 style="color: #2196F3; margin: 10px 0;">Dispute Under Review</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Your dispute has been assigned to our support team and is now under active review. We are analyzing all the evidence you provided.</p>
    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Issue Type:</strong> ${issueType}</p>
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Status:</strong> In Review</p>
    </div>
    <p style="font-size: 16px; color: #555;">We typically provide a response within 3-5 business days. Thank you for your patience.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const disputeMoreInfoNeededTemplate = (userName, reason, bookingId) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #ff9800;">⚠️</div>
      <h1 style="color: #ff9800; margin: 10px 0;">Additional Information Needed</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">To proceed with your dispute review, we need some additional information or evidence from you.</p>
    <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
      <p style="font-size: 16px; color: #e65100; margin: 5px 0;"><strong>What we need:</strong></p>
      <p style="font-size: 16px; color: #e65100; margin: 5px 0;">${reason}</p>
      <p style="font-size: 16px; color: #e65100; margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
    </div>
    <p style="font-size: 16px; color: #555;">Please log into your account and provide the requested information within 5 business days. Failure to respond may result in case closure.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const disputeEscalatedTemplate = (userName, reason, bookingId) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #d32f2f;">⬆️</div>
      <h1 style="color: #d32f2f; margin: 10px 0;">Dispute Escalated</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Your dispute has been escalated to our senior resolution team for further investigation.</p>
    <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d32f2f;">
      <p style="font-size: 16px; color: #b71c1c; margin: 5px 0;"><strong>Escalation Reason:</strong></p>
      <p style="font-size: 16px; color: #b71c1c; margin: 5px 0;">${reason}</p>
      <p style="font-size: 16px; color: #b71c1c; margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
      <p style="font-size: 16px; color: #b71c1c; margin: 5px 0;"><strong>Status:</strong> Escalated</p>
    </div>
    <p style="font-size: 16px; color: #555;">A senior team member will contact you shortly to discuss the next steps. We appreciate your cooperation.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const disputeResolvedTemplate = (userName, resolution, refundAmount, bookingId) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #28a745;">✓</div>
      <h1 style="color: #28a745; margin: 10px 0;">Dispute Resolved</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Your dispute has been reviewed and resolved. Below are the details of the decision.</p>
    <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Resolution:</strong> ${resolution}</p>
      ${refundAmount ? `<p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Refund Amount:</strong> $${refundAmount}</p>` : ''}
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Status:</strong> Resolved</p>
    </div>
    <p style="font-size: 16px; color: #555;">If you have any questions about this decision, please feel free to contact our support team.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const refundProcessedTemplate = (userName, refundAmount, bookingId, refundDate) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #28a745;">💰</div>
      <h1 style="color: #28a745; margin: 10px 0;">Refund Processed</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">The refund from your dispute resolution has been processed successfully.</p>
    <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Refund Amount:</strong> $${refundAmount}</p>
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Processing Date:</strong> ${refundDate}</p>
    </div>
    <p style="font-size: 16px; color: #555;">The funds should appear in your account within 3-5 business days depending on your bank. Please check your transaction history if you don't see it.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const disputeResponseTemplate = (userName, responderName, responseMessage, bookingId) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #2196F3;">💬</div>
      <h1 style="color: #2196F3; margin: 10px 0;">New Response on Your Dispute</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">${responderName} has added a response to your dispute case.</p>
    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2196F3;">
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>From:</strong> ${responderName}</p>
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
      <p style="font-size: 14px; color: #1565c0; margin: 10px 0; padding: 10px; background-color: white; border-radius: 3px;">${responseMessage}</p>
    </div>
    <p style="font-size: 16px; color: #555;">Please log into your account to view the full conversation and respond if needed.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const disputeClosedTemplate = (userName, reason, bookingId) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #666;">🔒</div>
      <h1 style="color: #333; margin: 10px 0;">Dispute Case Closed</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Your dispute case has been officially closed.</p>
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Booking ID:</strong> ${bookingId}</p>
      <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Reason:</strong> ${reason}</p>
      <p style="font-size: 16px; color: #333; margin: 5px 0;"><strong>Status:</strong> Closed</p>
    </div>
    <p style="font-size: 16px; color: #555;">If you believe this case needs to be reopened, please contact our support team within 30 days. Archive of this case will be available in your account history.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;
