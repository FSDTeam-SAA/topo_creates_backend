// Subscription Email Templates

/**
 * Template for lender when subscription is activated (free or paid)
 */
export const subscriptionActivatedTemplate = (
  lenderName,
  planName,
  price,
  currency,
  billingCycle,
  expiryDate,
  features = []
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
        .plan-badge { display: inline-block; background: #667eea; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #555; }
        .detail-value { color: #333; }
        .price { font-size: 28px; font-weight: bold; color: #667eea; }
        .features-list { list-style: none; padding: 0; }
        .features-list li { padding: 8px 0; }
        .features-list li:before { content: "✓ "; color: #27ae60; font-weight: bold; margin-right: 8px; }
        .info-box { background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db; }
        .footer { text-align: center; margin-top: 30px; color: #777; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Subscription Activated!</h1>
        </div>
        <div class="content">
          <p>Hi ${lenderName},</p>
          <p>Congratulations! Your subscription has been successfully activated. You now have access to all premium features.</p>
          
          <div style="text-align: center;">
            <span class="plan-badge">${planName}</span>
            ${price > 0 ? `<div class="price">$${price.toFixed(2)} ${currency}/${billingCycle}</div>` : '<div class="plan-badge" style="background: #27ae60;">FREE PLAN</div>'}
          </div>
          
          <div class="details">
            <h3 style="margin-top: 0; color: #667eea;">Subscription Details</h3>
            <div class="detail-row">
              <span class="detail-label">Plan:</span>
              <span class="detail-value">${planName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Billing Cycle:</span>
              <span class="detail-value">${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Start Date:</span>
              <span class="detail-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Expiry Date:</span>
              <span class="detail-value" style="color: #e74c3c; font-weight: bold;">${expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          ${
            features.length > 0
              ? `
            <div class="details">
              <h3 style="margin-top: 0; color: #667eea;">Plan Features</h3>
              <ul class="features-list">
                ${features.map((feature) => `<li>${feature}</li>`).join('')}
              </ul>
            </div>
          `
              : ''
          }

          <div class="info-box">
            <strong>📌 What's Included?</strong>
            <p style="margin: 10px 0 0 0;">Your subscription is now active and you can start enjoying all the premium benefits. Visit your dashboard to explore new features and maximize your presence on Topo Creates.</p>
          </div>

          <p>Thank you for subscribing to Topo Creates!</p>
          
          <div class="footer">
            <p>Questions about your subscription? Contact our support team.</p>
            <p>&copy; ${new Date().getFullYear()} Topo Creates. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Template for lender when subscription payment is successful (paid plan)
 */
export const subscriptionPaymentConfirmationTemplate = (
  lenderName,
  planName,
  amount,
  currency,
  paymentId,
  invoiceDate
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
        .receipt-box { background: #d5f4e6; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #27ae60; }
        .footer { text-align: center; margin-top: 30px; color: #777; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Payment Successful!</h1>
        </div>
        <div class="content">
          <div class="success-icon">🎉</div>
          
          <p>Hi ${lenderName},</p>
          <p>Thank you for your subscription payment! Your transaction has been processed successfully.</p>
          
          <div class="amount">$${amount.toFixed(2)} ${currency}</div>
          
          <div class="details">
            <h3 style="margin-top: 0; color: #27ae60;">Payment Receipt</h3>
            <div class="detail-row">
              <span class="detail-label">Plan:</span>
              <span class="detail-value">${planName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount:</span>
              <span class="detail-value">$${amount.toFixed(2)} ${currency}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment ID:</span>
              <span class="detail-value" style="font-family: monospace; font-size: 12px;">${paymentId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Invoice Date:</span>
              <span class="detail-value">${invoiceDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value" style="color: #27ae60; font-weight: bold;">✓ Paid</span>
            </div>
          </div>

          <div class="receipt-box">
            <strong>💡 Next Steps</strong>
            <p style="margin: 10px 0 0 0;">Your subscription is now active and you have full access to all premium features. You can manage your subscription settings in your account dashboard at any time.</p>
          </div>

          <p>Thank you for choosing Topo Creates!</p>
          
          <div class="footer">
            <p>Need a copy of your invoice? Check your account dashboard or contact support.</p>
            <p>&copy; ${new Date().getFullYear()} Topo Creates. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Template for lender when subscription payment fails
 */
export const subscriptionPaymentFailedTemplate = (
  lenderName,
  planName,
  amount,
  currency,
  errorReason
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
        .action-button { display: inline-block; background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; text-align: center; }
        .footer { text-align: center; margin-top: 30px; color: #777; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚠️ Payment Failed</h1>
        </div>
        <div class="content">
          <div class="error-icon">❌</div>
          
          <p>Hi ${lenderName},</p>
          <p>Unfortunately, we were unable to process your subscription payment. Please review the details below and try again.</p>
          
          <div class="details">
            <h3 style="margin-top: 0; color: #e74c3c;">Payment Details</h3>
            <div class="detail-row">
              <span class="detail-label">Plan:</span>
              <span class="detail-value">${planName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount:</span>
              <span class="detail-value">$${amount.toFixed(2)} ${currency}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value" style="color: #e74c3c; font-weight: bold;">✗ Failed</span>
            </div>
          </div>

          <div class="error-box">
            <h3 style="margin-top: 0; color: #e74c3c;">Reason for Failure</h3>
            <p>${errorReason}</p>
            <p style="margin-bottom: 0; font-size: 14px; color: #666;">Common reasons: Insufficient funds, expired card, or incorrect details. Please update your payment method and try again.</p>
          </div>

          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/subscription/checkout" class="action-button">Retry Payment</a>
          </p>

          <p>If you continue to experience issues, please contact our support team for assistance.</p>
          
          <div class="footer">
            <p>Your subscription will not be active until payment is successful.</p>
            <p>&copy; ${new Date().getFullYear()} Topo Creates. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Template for lender when subscription checkout expires
 */
export const subscriptionCheckoutExpiredTemplate = (
  lenderName,
  planName,
  amount,
  currency
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert-icon { font-size: 60px; text-align: center; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f39c12; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #555; }
        .detail-value { color: #333; }
        .alert-box { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .action-button { display: inline-block; background: #f39c12; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; text-align: center; }
        .footer { text-align: center; margin-top: 30px; color: #777; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Checkout Session Expired</h1>
        </div>
        <div class="content">
          <div class="alert-icon">⏳</div>
          
          <p>Hi ${lenderName},</p>
          <p>Your subscription checkout session has expired. The checkout link is no longer valid, but you can easily start over.</p>
          
          <div class="details">
            <h3 style="margin-top: 0; color: #f39c12;">Plan Details</h3>
            <div class="detail-row">
              <span class="detail-label">Plan:</span>
              <span class="detail-value">${planName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Amount:</span>
              <span class="detail-value">$${amount.toFixed(2)} ${currency}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value" style="color: #f39c12; font-weight: bold;">Session Expired</span>
            </div>
          </div>

          <div class="alert-box">
            <strong>⏳ Session Timeout</strong>
            <p style="margin: 10px 0 0 0;">Checkout sessions are valid for 24 hours. Your session has expired, but you can create a new one by clicking the button below.</p>
          </div>

          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/subscription/plans" class="action-button">Continue to Checkout</a>
          </p>

          <p>If you have any questions or need assistance, please reach out to our support team.</p>
          
          <div class="footer">
            <p>We look forward to activating your subscription!</p>
            <p>&copy; ${new Date().getFullYear()} Topo Creates. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Template for lender when subscription is refunded
 */
export const subscriptionRefundedTemplate = (
  lenderName,
  planName,
  refundAmount,
  currency,
  refundId
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .refund-icon { font-size: 60px; text-align: center; margin: 20px 0; }
        .amount { font-size: 32px; font-weight: bold; color: #9b59b6; text-align: center; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9b59b6; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #555; }
        .detail-value { color: #333; }
        .info-box { background: #f0e6ff; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #9b59b6; }
        .footer { text-align: center; margin-top: 30px; color: #777; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Refund Processed</h1>
        </div>
        <div class="content">
          <div class="refund-icon">↩️</div>
          
          <p>Hi ${lenderName},</p>
          <p>We've successfully processed a refund for your subscription. The funds will be returned to your original payment method.</p>
          
          <div class="amount">$${refundAmount.toFixed(2)} ${currency}</div>
          
          <div class="details">
            <h3 style="margin-top: 0; color: #9b59b6;">Refund Details</h3>
            <div class="detail-row">
              <span class="detail-label">Plan:</span>
              <span class="detail-value">${planName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Refund Amount:</span>
              <span class="detail-value">$${refundAmount.toFixed(2)} ${currency}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Refund ID:</span>
              <span class="detail-value" style="font-family: monospace; font-size: 12px;">${refundId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Processed Date:</span>
              <span class="detail-value">${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Subscription Status:</span>
              <span class="detail-value" style="color: #e74c3c; font-weight: bold;">✗ Inactive</span>
            </div>
          </div>

          <div class="info-box">
            <strong>⏱️ Refund Timeline</strong>
            <p style="margin: 10px 0 0 0;">Your refund should appear in your bank account within 5-10 business days, depending on your bank's processing time. The exact timeline varies by financial institution.</p>
          </div>

          <p>Your subscription has been deactivated. If you'd like to reactivate your subscription later, you can do so anytime from your account settings.</p>
          
          <div class="footer">
            <p>Questions about your refund? Contact our support team for more information.</p>
            <p>&copy; ${new Date().getFullYear()} Topo Creates. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Template for lender when subscription is expiring soon
 */
export const subscriptionExpiringTemplate = (
  lenderName,
  planName,
  daysRemaining,
  expiryDate
) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .alert-icon { font-size: 60px; text-align: center; margin: 20px 0; }
        .countdown { font-size: 36px; font-weight: bold; color: #e74c3c; text-align: center; margin: 20px 0; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3498db; }
        .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .detail-label { font-weight: bold; color: #555; }
        .detail-value { color: #333; }
        .reminder-box { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
        .action-button { display: inline-block; background: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; text-align: center; }
        .footer { text-align: center; margin-top: 30px; color: #777; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⏰ Your Subscription Expires Soon</h1>
        </div>
        <div class="content">
          <div class="alert-icon">⏳</div>
          
          <p>Hi ${lenderName},</p>
          <p>Your subscription is about to expire! Don't lose access to premium features. Renew your subscription before it's too late.</p>
          
          <div class="countdown">${daysRemaining} Days Remaining</div>
          
          <div class="details">
            <h3 style="margin-top: 0; color: #3498db;">Subscription Details</h3>
            <div class="detail-row">
              <span class="detail-label">Plan:</span>
              <span class="detail-value">${planName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Expiry Date:</span>
              <span class="detail-value" style="color: #e74c3c; font-weight: bold;">${expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value" style="color: #f39c12; font-weight: bold;">⚠️ Expiring</span>
            </div>
          </div>

          <div class="reminder-box">
            <strong>📝 What Happens When Your Subscription Expires?</strong>
            <p style="margin: 10px 0 0 0;">You will lose access to premium features. Your listings may become inactive, and you won't be able to process bookings. Renew your subscription now to continue enjoying uninterrupted service.</p>
          </div>

          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL}/subscription/renew" class="action-button">Renew Subscription</a>
          </p>

          <p>If you have any questions or need help with your subscription, please contact our support team.</p>
          
          <div class="footer">
            <p>Thank you for being a valued member of Topo Creates!</p>
            <p>&copy; ${new Date().getFullYear()} Topo Creates. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};
