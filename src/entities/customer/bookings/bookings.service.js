import {Booking} from "../../booking/booking.model.js";
import Listing from "../../lender/Listings/listings.model.js";


export const createBookingService = async (data) => {
  //console.log('Booking data:', data);
  const {
    customer,
    lender,
    listingId,
    rentalStartDate,
    rentalEndDate,
  } = data;

  // Validate Listing
  const listingDoc = await Listing.findById({_id: listingId});
  if (!listingDoc) {
    throw new Error('Listing not found');
  }

  // Calculate rentalDurationDays
  const start = new Date(rentalStartDate);
  const end = new Date(rentalEndDate);
  if (start >= end) {
    throw new Error('Rental end date must be after start date');
  }

  const rentalDurationDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

  // Create booking
  const newBooking = await Booking.create({
    customer,
    lender,
    listing: listingId,
    rentalStartDate: start,
    rentalEndDate: end,
    rentalDurationDays,
  });

  return newBooking;
};

