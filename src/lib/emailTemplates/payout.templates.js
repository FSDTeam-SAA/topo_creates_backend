// Payout Email Templates

/**
 * Template for lender when payout request is created
 */
export const payoutRequestCreatedTemplate = (
  lenderName,
  requestedAmount,
  bookingId,
  commission
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #555; }
        .detail-value { color: #333; }
        .amount { font-size: 32px; font-weight: bold; color: #667eea; text-align: center; margin: 20px 0; }
        .info-box { background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db; }
        .footer { text-align: center; margin-top: 30px; color: #777; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Payout Request Submitted</h1>
        </div>
        <div class="content">
          <p>Hi ${lenderName},</p>
          <p>Your payout request has been successfully submitted and is now pending admin approval.</p>
          
          <div class="amount">$${requestedAmount.toFixed(2)}</div>
          
          <div class="details">
            <h3 style="margin-top: 0; color: #667eea;">Request Details</h3>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span class="detail-value">${bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Requested Amount:</span>
              <span class="detail-value">$${requestedAmount.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Commission:</span>
              <span class="detail-value">${commission}%</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value" style="color: #f39c12; font-weight: bold;">Pending</span>
            </div>
          </div>

          <div class="info-box">
            <strong>📌 What's Next?</strong>
            <p style="margin: 10px 0 0 0;">Our admin team will review your request. Once approved, the funds will be transferred to your connected Stripe account. You'll receive a confirmation email when the transfer is complete.</p>
          </div>

          <p>Thank you for using our platform!</p>
          
          <div class="footer">
            <p>If you have any questions, please contact our support team.</p>
            <p>&copy; ${new Date().getFullYear()} Topo Creates. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Template for admin when new payout request is received
 */
export const payoutRequestReceivedTemplate = (
  lenderName,
  lenderId,
  requestedAmount,
  bookingId,
  lenderPrice,
  adminsProfit
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e74c3c; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #555; }
        .detail-value { color: #333; }
        .profit { color: #27ae60; font-weight: bold; }
        .action-button { display: inline-block; background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .footer { text-align: center; margin-top: 30px; color: #777; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 New Payout Request</h1>
        </div>
        <div class="content">
          <div class="alert">
            <strong>⚠️ Action Required</strong>
            <p style="margin: 10px 0 0 0;">A new payout request requires your review and approval.</p>
          </div>
          
          <div class="details">
            <h3 style="margin-top: 0; color: #e74c3c;">Lender Information</h3>
            <div class="detail-row">
              <span class="detail-label">Lender Name:</span>
              <span class="detail-value">${lenderName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Lender ID:</span>
              <span class="detail-value">${lenderId}</span>
            </div>
          </div>

          <div class="details">
            <h3 style="margin-top: 0; color: #e74c3c;">Financial Details</h3>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span class="detail-value">${bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Lender Price:</span>
              <span class="detail-value">$${lenderPrice.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Admin's Profit:</span>
              <span class="detail-value profit">$${adminsProfit.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payout Amount:</span>
              <span class="detail-value" style="font-size: 18px; font-weight: bold; color: #e74c3c;">$${requestedAmount.toFixed(2)}</span>
            </div>
          </div>

          <p style="text-align: center; margin-top: 30px;">
            <a href="${process.env.ADMIN_DASHBOARD_URL || '#'}/payouts" class="action-button">Review Payout Request</a>
          </p>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Topo Creates Admin Panel. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Template for lender when payout is successfully transferred
 */
export const payoutTransferredTemplate = (
  lenderName,
  transferredAmount,
  stripeTransferId,
  bookingId
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #27ae60 0%, #229954 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success-icon { font-size: 60px; text-align: center; margin: 20px 0; }
        .amount { font-size: 36px; font-weight: bold; color: #27ae60; text-align: center; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #555; }
        .detail-value { color: #333; }
        .info-box { background: #d5f4e6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60; }
        .footer { text-align: center; margin-top: 30px; color: #777; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Payout Transferred Successfully!</h1>
        </div>
        <div class="content">
          <div class="success-icon">🎉</div>
          
          <p>Hi ${lenderName},</p>
          <p>Great news! Your payout has been approved and transferred to your Stripe account.</p>
          
          <div class="amount">$${transferredAmount.toFixed(2)}</div>
          
          <div class="details">
            <h3 style="margin-top: 0; color: #27ae60;">Transfer Details</h3>
            <div class="detail-row">
              <span class="detail-label">Amount Transferred:</span>
              <span class="detail-value">$${transferredAmount.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Booking Reference:</span>
              <span class="detail-value">${bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Stripe Transfer ID:</span>
              <span class="detail-value" style="font-family: monospace; font-size: 12px;">${stripeTransferId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value" style="color: #27ae60; font-weight: bold;">✓ Paid</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Transfer Date:</span>
              <span class="detail-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          <div class="info-box">
            <strong>💡 Funds Availability</strong>
            <p style="margin: 10px 0 0 0;">The funds should appear in your connected bank account within 2-5 business days, depending on your bank's processing time. You can track this transfer in your Stripe dashboard.</p>
          </div>

          <p>Thank you for being a valued lender on our platform!</p>
          
          <div class="footer">
            <p>Questions about this transfer? Contact our support team.</p>
            <p>&copy; ${new Date().getFullYear()} Topo Creates. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Template for lender and admin when payout transfer fails
 */
export const payoutFailedTemplate = (
  recipientName,
  requestedAmount,
  bookingId,
  errorReason,
  isAdmin = false
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .error-icon { font-size: 60px; text-align: center; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e74c3c; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #555; }
        .detail-value { color: #333; }
        .error-box { background: #fee; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #e74c3c; }
        .error-reasons { background: #fff; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .error-item { padding: 8px 0; color: #c0392b; }
        .action-box { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .footer { text-align: center; margin-top: 30px; color: #777; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Payout Transfer Failed</h1>
        </div>
        <div class="content">
          <div class="error-icon">❌</div>
          
          <p>Hi ${recipientName},</p>
          <p>${isAdmin ? 'A payout transfer has failed and requires your attention.' : 'Unfortunately, we were unable to process your payout request at this time.'}</p>
          
          <div class="details">
            <h3 style="margin-top: 0; color: #e74c3c;">Payout Information</h3>
            <div class="detail-row">
              <span class="detail-label">Requested Amount:</span>
              <span class="detail-value">$${requestedAmount.toFixed(2)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Booking ID:</span>
              <span class="detail-value">${bookingId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value" style="color: #e74c3c; font-weight: bold;">✗ Failed</span>
            </div>
          </div>

          <div class="error-box">
            <h3 style="margin-top: 0; color: #e74c3c;">Reason for Failure</h3>
            <div class="error-reasons">
              ${
                Array.isArray(errorReason)
                  ? errorReason
                      .map((err) => `<div class="error-item">• ${err}</div>`)
                      .join('')
                  : `<div class="error-item">${errorReason}</div>`
              }
            </div>
          </div>

          <div class="action-box">
            <strong>🔧 ${isAdmin ? 'Required Actions' : 'Next Steps'}</strong>
            ${
              isAdmin
                ? '<p style="margin: 10px 0 0 0;">Please review the lender\'s Stripe account settings and ensure all requirements are met before attempting the transfer again. Contact the lender if necessary.</p>'
                : '<p style="margin: 10px 0 0 0;">Please complete your Stripe onboarding and ensure all account details are correctly set up. Once resolved, you can submit a new payout request. If you need assistance, please contact our support team.</p>'
            }
          </div>

          ${!isAdmin ? '<p>We apologize for the inconvenience and appreciate your patience.</p>' : ''}
          
          <div class="footer">
            <p>${isAdmin ? 'Admin Panel Notification' : 'Need help? Contact our support team.'}</p>
            <p>&copy; ${new Date().getFullYear()} Topo Creates. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
