// File: utils/priceUtils.js

/**
 * Calculate total fees and breakdown
 * @param {Object} options
 * @param {Object} options.listing - The listing document
 * @param {Number} options.rentalDurationDays - 4 or 8
 * @param {String} options.deliveryMethod - "Shipping" or "Pickup"
 * @param {Boolean} options.insuranceOptIn - true if insurance opted in
 * @param {Object} [options.shippingAddress] - Optional, for advanced shipping logic
 * @returns {Object} - Price breakdown
 */
export const calculateFees = ({ listing, rentalDurationDays, deliveryMethod, insuranceOptIn, shippingAddress }) => {
  const basePrice = rentalDurationDays === 8 ? listing.price8Day : listing.price4Day;
  const insuranceFee = insuranceOptIn ? 5 : 0;
  const pickupBookingFee = deliveryMethod === "Pickup" ? 10 : 0;

  // Static or simplified logic; integrate with real shipping rates if needed
  let shippingFee = 0;
  if (deliveryMethod === "Shipping") {
    // Example: could be based on zone/postcode distance in future
    shippingFee = 15;
  }

  const totalAmount = basePrice + insuranceFee + shippingFee + pickupBookingFee;

  // Platform commission (10% default)
  const platformCommissionRate = 0.1;
  const platformCommissionAmount = parseFloat((basePrice * platformCommissionRate).toFixed(2));
  const lenderEarnings = parseFloat((totalAmount - platformCommissionAmount).toFixed(2));

  return {
    baseRentalPrice: basePrice,
    insuranceFee,
    shippingFee,
    pickupBookingFee,
    totalAmount,
    platformCommissionRate,
    platformCommissionAmount,
    lenderEarnings
  };
};