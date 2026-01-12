// ✅ KYC Email Templates

export const kycVerifiedTemplate = (userName) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #28a745;">✓</div>
      <h1 style="color: #28a745; margin: 10px 0;">KYC Verification Successful</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Great news! Your identity verification has been completed successfully. Your account is now fully verified and you can enjoy all features of our platform.</p>
    <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 16px; color: #2e7d32; margin: 0;"><strong>Status:</strong> Verified ✓</p>
    </div>
    <p style="font-size: 16px; color: #555;">If you have any questions, please contact our support team.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const kycRequiresInputTemplate = (userName, reason) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #ffc107;">⚠</div>
      <h1 style="color: #ff9800; margin: 10px 0;">Additional Information Needed</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">We need some additional information to complete your identity verification. This will only take a few minutes.</p>
    <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
      <p style="font-size: 16px; color: #e65100; margin: 0;"><strong>What to do:</strong> Please log in to your account and resume the verification process.</p>
    </div>
    <p style="font-size: 16px; color: #555;">Please complete this within 7 days to avoid account restrictions.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const kycProcessingTemplate = (userName) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #2196F3;">⏳</div>
      <h1 style="color: #2196F3; margin: 10px 0;">Verification in Progress</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Your identity verification is currently being processed. This typically takes 1-2 hours. We will notify you as soon as the verification is complete.</p>
    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 16px; color: #1565c0; margin: 0;"><strong>Status:</strong> Processing</p>
    </div>
    <p style="font-size: 16px; color: #555;">Thank you for your patience!</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const kycFailedTemplate = (userName, reason) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #d32f2f;">✕</div>
      <h1 style="color: #d32f2f; margin: 10px 0;">Verification Session Expired/Failed</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Your identity verification session has expired or was not completed successfully.</p>
    <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d32f2f;">
      <p style="font-size: 16px; color: #b71c1c; margin: 0;"><strong>Reason:</strong> ${reason || 'Session expired or document verification failed'}</p>
    </div>
    <p style="font-size: 16px; color: #555;">Please try again to complete your identity verification. Log in to your account and start a new verification session.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const kycInitiatedTemplate = (userName, verificationLink) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #333; margin: 10px 0;">KYC Verification Required</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">To complete your account setup and unlock all features, we need to verify your identity. This is a quick and secure process.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${verificationLink}" style="background-color: #007BFF; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Start Verification</a>
    </div>
    <p style="font-size: 14px; color: #999; text-align: center;">Or copy this link: ${verificationLink}</p>
    <p style="font-size: 16px; color: #555;">You have 7 days to complete this verification. Thank you!</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;
