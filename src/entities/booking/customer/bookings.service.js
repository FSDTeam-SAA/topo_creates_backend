import { Booking } from "../../booking/booking.model.js";
import Listing from "../../lender/Listings/listings.model.js";
//import { createPaymentIntent, refundPayment } from "../../../lib/stripe.js";


export const calculatePrice = async (payload) => {
  const { listingId, rentalStartDate, rentalEndDate, rentalDurationDays, deliveryMethod, insuranceOptIn, shippingAddress } = payload;

  if (!listingId || !rentalStartDate || !rentalEndDate || !rentalDurationDays || !deliveryMethod) {
    throw new Error("Missing required fields");
  }

  const listing = await Listing.findById(listingId);
  if (!listing) throw new Error("Listing not found");

  return calculateFees({ listing, rentalDurationDays, deliveryMethod, insuranceOptIn, shippingAddress });
};


export const createBookingService = async (bookingData) => {
  const {
    listingId,
    rentalStartDate,
    rentalEndDate,
    insuranceOptIn = false,
    deliveryMethod = 'Shipping',
    shippingAddress,
  } = bookingData;

  const listing = await Listing.findById(listingId);
  if (!listing) throw new Error('Listing not found');

  const start = new Date(rentalStartDate);
  const end = new Date(rentalEndDate);
  const rentalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  if (rentalDays <= 0) throw new Error('Invalid rental period');

  const baseRentalPrice = (Number(listing.rentalPricePerDay) || 0) * rentalDays;
  const insuranceFee = insuranceOptIn ? (Number(listing.insurance) || 0) * rentalDays : 0;
  const shippingFee = deliveryMethod === 'Shipping' ? (Number(listing.deliveryFee) || 0) : 0;
  const totalAmount = baseRentalPrice + insuranceFee + shippingFee;

  const platformCommissionRate = 0.1;
  const platformCommissionAmount = totalAmount * platformCommissionRate;
  const lenderEarnings = totalAmount - platformCommissionAmount;

  const booking = await Booking.create({
    customer: bookingData.customer,
    lender: listing.lenderId, 
    listing: listingId,
    rentalStartDate: start,
    rentalEndDate: end,
    rentalDurationDays: rentalDays,

    baseRentalPrice,
    insuranceOptIn,
    insuranceFee,
    shippingFee,
    totalAmount,

    platformCommissionRate,
    platformCommissionAmount,
    lenderEarnings,

    deliveryMethod,
    shippingAddress: deliveryMethod === 'Shipping' ? shippingAddress : undefined,
  });

  return booking;
};



export const getBookingsByCustomer = async (customerId) => {
  return Booking.find({ customer: customerId }).sort({ createdAt: -1 });
};


export const getBookingById = async (bookingId, customerId) => {
  const booking = await Booking.findOne({ _id: bookingId, customer: customerId });
  if (!booking) throw new Error("Booking not found");
  return booking;
};


export const markReturned = async (bookingId, customerId, { returnTrackingNumber }) => {
  const booking = await getBookingById(bookingId, customerId);
  if (!['InPossessionOfCustomer', 'ShippedToCustomer'].includes(booking.status)) {
    throw new Error("Cannot mark return from this status");
  }

  booking.status = 'ShippedToLender';
  if (returnTrackingNumber) booking.returnTrackingNumber = returnTrackingNumber;
  booking.statusHistory.push({ status: 'ShippedToLender', timestamp: new Date(), updatedBy: customerId });
  await booking.save();
  return booking;
};


export const cancelBooking = async (bookingId, customerId) => {
  const booking = await getBookingById(bookingId, customerId);
  if (!['Pending', 'Confirmed'].includes(booking.status)) {
    throw new Error("Booking cannot be cancelled at this stage");
  }

  booking.status = 'CancelledByCustomer';
  booking.statusHistory.push({ status: 'CancelledByCustomer', timestamp: new Date(), updatedBy: customerId });
  booking.paymentStatus = 'Refunded';

  if (booking.paymentIntentId) {
    await refundPayment({ paymentIntentId: booking.paymentIntentId });
  }

  await booking.save();
  return booking;
};


export const raiseDispute = async (bookingId, customerId, data) => {
  const booking = await getBookingById(bookingId, customerId);
  booking.status = 'Disputed';
  booking.statusHistory.push({ status: 'Disputed', timestamp: new Date(), updatedBy: customerId });
  booking.customerNotes = data.reason || 'Dispute opened';
  await booking.save();
  return booking;
};


export const confirmPickupTime = async (bookingId, customerId, { pickupConfirmedTime }) => {
  const booking = await getBookingById(bookingId, customerId);
  if (booking.deliveryMethod !== 'Pickup') {
    throw new Error("This booking is not a pickup order");
  }
  booking.pickupConfirmedTime = new Date(pickupConfirmedTime);
  await booking.save();
  return booking;
};