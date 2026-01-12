// ✅ Booking Email Templates

export const bookingCreatedTemplate = (
  userName,
  dressName,
  rentalDays,
  deliveryMethod,
  totalAmount
) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #333; margin: 10px 0;">Booking Confirmation</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Thank you for creating your booking! We're excited to help you get the perfect dress.</p>
    <div style="background-color: #f0f8ff; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Dress:</strong> ${dressName}</p>
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Rental Duration:</strong> ${rentalDays} days</p>
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Delivery Method:</strong> ${deliveryMethod}</p>
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Total Amount:</strong> $${totalAmount}</p>
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Status:</strong> Pending Lender Approval</p>
    </div>
    <p style="font-size: 16px; color: #555;">Your booking is awaiting confirmation from the lender. We'll notify you as soon as they respond.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const bookingConfirmedTemplate = (
  userName,
  dressName,
  rentalDays,
  startDate,
  endDate,
  totalAmount
) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #28a745;">✓</div>
      <h1 style="color: #28a745; margin: 10px 0;">Booking Accepted!</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Great news! Your booking has been accepted and confirmed. Payment has been processed successfully.</p>
    <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Dress:</strong> ${dressName}</p>
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Rental Period:</strong> ${startDate} to ${endDate}</p>
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Duration:</strong> ${rentalDays} days</p>
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Total Paid:</strong> $${totalAmount}</p>
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Status:</strong> Confirmed</p>
    </div>
    <p style="font-size: 16px; color: #555;">The lender is now preparing your dress for shipment. We'll send you tracking information once it's on the way!</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const bookingRejectedTemplate = (userName, dressName, reason) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #d32f2f;">✕</div>
      <h1 style="color: #d32f2f; margin: 10px 0;">Booking Rejected</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Unfortunately, your booking request has been rejected by the lender.</p>
    <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d32f2f;">
      <p style="font-size: 16px; color: #b71c1c; margin: 5px 0;"><strong>Dress:</strong> ${dressName}</p>
      <p style="font-size: 16px; color: #b71c1c; margin: 5px 0;"><strong>Reason:</strong> ${reason || 'The dress is no longer available for the requested dates'}</p>
    </div>
    <p style="font-size: 16px; color: #555;">No charges have been made to your account. Please try booking another dress or contact our support team for assistance.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const paymentFailedTemplate = (
  userName,
  dressName,
  totalAmount,
  reason
) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #ff9800;">⚠️</div>
      <h1 style="color: #ff9800; margin: 10px 0;">Payment Failed</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">We were unable to process the payment for your booking.</p>
    <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ff9800;">
      <p style="font-size: 16px; color: #e65100; margin: 5px 0;"><strong>Dress:</strong> ${dressName}</p>
      <p style="font-size: 16px; color: #e65100; margin: 5px 0;"><strong>Amount:</strong> $${totalAmount}</p>
      <p style="font-size: 16px; color: #e65100; margin: 5px 0;"><strong>Reason:</strong> ${reason || 'Card declined or insufficient funds'}</p>
    </div>
    <p style="font-size: 16px; color: #555;">Please log in to your account and update your payment method, then try again. Contact support if you need assistance.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const shipmentPreparingTemplate = (
  userName,
  dressName,
  estimatedShipDate
) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #2196F3;">📦</div>
      <h1 style="color: #2196F3; margin: 10px 0;">Preparing Your Shipment</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Good news! The lender is preparing your dress for shipment.</p>
    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Dress:</strong> ${dressName}</p>
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Estimated Ship Date:</strong> ${estimatedShipDate}</p>
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Status:</strong> Preparing Shipment</p>
    </div>
    <p style="font-size: 16px; color: #555;">We'll send you tracking information as soon as the package is on its way. Thank you for your patience!</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const labelReadyTemplate = (userName, dressName, trackingNumber) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #2196F3;">🏷️</div>
      <h1 style="color: #2196F3; margin: 10px 0;">Shipping Label Ready</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Your shipping label has been generated. Your dress will be shipped very soon!</p>
    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Dress:</strong> ${dressName}</p>
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Tracking Number:</strong> ${trackingNumber || 'Coming soon'}</p>
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Status:</strong> Label Ready</p>
    </div>
    <p style="font-size: 16px; color: #555;">Watch for your shipment! You'll receive tracking updates once the package is picked up by the carrier.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const shippedToCustomerTemplate = (
  userName,
  dressName,
  trackingNumber,
  trackingUrl
) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #4CAF50;">🚚</div>
      <h1 style="color: #4CAF50; margin: 10px 0;">Your Dress is On the Way!</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Exciting news! Your dress has been shipped and is on its way to you.</p>
    <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Dress:</strong> ${dressName}</p>
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Status:</strong> Shipped to Customer</p>
    </div>
    <div style="text-align: center; margin: 20px 0;">
      <a href="${trackingUrl}" style="background-color: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-size: 16px; font-weight: bold;">Track Your Shipment</a>
    </div>
    <p style="font-size: 16px; color: #555;">Expected delivery time varies depending on your location. Thank you for your patience!</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const dressDeliveredTemplate = (userName, dressName, returnDeadline) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #28a745;">📬</div>
      <h1 style="color: #28a745; margin: 10px 0;">Your Dress Has Arrived!</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Your dress has been delivered successfully! Enjoy wearing it to your special event.</p>
    <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Dress:</strong> ${dressName}</p>
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Status:</strong> Delivered</p>
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Return Deadline:</strong> ${returnDeadline}</p>
    </div>
    <p style="font-size: 16px; color: #555;"><strong>Important:</strong> Please ensure the dress is returned by the deadline to avoid late fees. Inspect the dress upon delivery and report any issues immediately.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const returnInitiatedTemplate = (
  userName,
  dressName,
  returnDeadline
) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #FF9800;">↩️</div>
      <h1 style="color: #FF9800; margin: 10px 0;">Return Process Initiated</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Your return request has been initiated. Here are the next steps:</p>
    <div style="background-color: #fff3e0; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 16px; color: #e65100; margin: 5px 0;"><strong>Dress:</strong> ${dressName}</p>
      <p style="font-size: 16px; color: #e65100; margin: 5px 0;"><strong>Return Deadline:</strong> ${returnDeadline}</p>
      <p style="font-size: 16px; color: #e65100; margin: 5px 0;"><strong>Status:</strong> Return Initiated</p>
    </div>
    <p style="font-size: 16px; color: #555;">Please package the dress securely and prepare it for return. A prepaid shipping label will be provided for you to print and use.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const shippedToLenderTemplate = (
  userName,
  dressName,
  trackingNumber,
  estimatedDelivery
) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #2196F3;">🚚</div>
      <h1 style="color: #2196F3; margin: 10px 0;">Dress Return Shipped</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Your dress has been shipped back to the lender. Thank you for renting with us!</p>
    <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Dress:</strong> ${dressName}</p>
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
      <p style="font-size: 16px; color: #1565c0; margin: 5px 0;"><strong>Status:</strong> Shipped to Lender</p>
    </div>
    <p style="font-size: 16px; color: #555;">Once the lender confirms receipt and inspection, your refund will be processed (if applicable).</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const bookingCompletedTemplate = (
  userName,
  dressName,
  rentalDays,
  refundAmount,
  refundStatus
) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #28a745;">✓</div>
      <h1 style="color: #28a745; margin: 10px 0;">Booking Completed</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Thank you for choosing Topo Creates! Your booking has been completed successfully.</p>
    <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Dress:</strong> ${dressName}</p>
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Rental Duration:</strong> ${rentalDays} days</p>
      ${refundAmount ? `<p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Refund Amount:</strong> $${refundAmount}</p>` : ''}
      <p style="font-size: 16px; color: #2e7d32; margin: 5px 0;"><strong>Refund Status:</strong> ${refundStatus}</p>
    </div>
    <p style="font-size: 16px; color: #555;">We hope you had a wonderful experience. Please consider leaving a review to help other customers.</p>
    <p style="font-size: 16px; color: #555;">We can't wait to see you again for your next special occasion!</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;

export const bookingCancelledTemplate = (
  userName,
  dressName,
  reason,
  refundAmount
) => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 10px; background-color: #f9f9f9;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 40px; color: #d32f2f;">✕</div>
      <h1 style="color: #d32f2f; margin: 10px 0;">Booking Cancelled</h1>
    </div>
    <p style="font-size: 16px; color: #555;">Hello ${userName},</p>
    <p style="font-size: 16px; color: #555;">Your booking has been cancelled.</p>
    <div style="background-color: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #d32f2f;">
      <p style="font-size: 16px; color: #b71c1c; margin: 5px 0;"><strong>Dress:</strong> ${dressName}</p>
      <p style="font-size: 16px; color: #b71c1c; margin: 5px 0;"><strong>Reason:</strong> ${reason || 'Booking cancelled'}</p>
      <p style="font-size: 16px; color: #b71c1c; margin: 5px 0;"><strong>Refund Amount:</strong> $${refundAmount}</p>
    </div>
    <p style="font-size: 16px; color: #555;">Your refund will be processed within 3-5 business days. If you have any questions, please contact our support team.</p>
    <footer style="border-top: 1px solid #ddd; padding-top: 10px; margin-top: 20px; text-align: center; font-size: 12px; color: #aaa;">
      &copy; 2026 Topo Creates. All rights reserved.
    </footer>
  </div>
`;
