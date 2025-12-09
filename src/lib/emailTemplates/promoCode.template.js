export const promoCodeTemplate = ({ name, code, discountType, discount, expiresAt }) => {
  const expiry = new Date(expiresAt).toLocaleDateString();

  return `
    <div style="font-family: Arial; padding: 20px;">
      <h2>Hello ${name || "Customer"},</h2>

      <p>We are excited to offer you an exclusive promo code!</p>

      <div style="background:#f4f4f4; padding: 15px; border-radius: 8px; margin-top: 10px;">
        <h3 style="margin: 0;">Promo Code:</h3>
        <p style="font-size: 18px; font-weight: bold; margin: 5px 0;">${code}</p>

        <p>
          Discount: 
          <strong>
            ${discountType === "PERCENTAGE" ? `${discount}%` : `${discount} AUD (Flat)`}
          </strong>
        </p>

        <p>Expires on: <strong>${expiry}</strong></p>
      </div>

      <p style="margin-top: 20px;">
        Use this promo code at checkout and enjoy your savings!
        <br /><br />
        Best regards,<br />
        <strong>Your Business Team</strong>
      </p>
    </div>
  `;
};
