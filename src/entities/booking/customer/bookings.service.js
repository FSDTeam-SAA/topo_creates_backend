
import mongoose from "mongoose";
import { Booking } from "../booking.model.js";
import Listing from "../../lender/Listings/listings.model.js";
import { createFilter, createPaginationInfo } from "../../../lib/pagination.js";


export const createBookingService = async ({ userId, role, body }) => {
  const {
    listingId,
    
    rentalStartDate,
    rentalEndDate,
    rentalDurationDays,
    size,
    deliveryMethod,
    isManualBooking,
    manualBookingDescription,
    customerNotes,
    lenderNotes,
    adminNotes,
  } = body;

   if (role === "USER") {
    const User = mongoose.model("User"); 
    const user = await User.findById(userId);
    if (!user || !user.kycVerified) {
      throw new Error("User KYC not verified. Cannot create booking.");
    }
  }

  if (!mongoose.Types.ObjectId.isValid(listingId)) {
    throw new Error("Invalid listing ID");
  }

  const listing = await Listing.findById(listingId);
  if (!listing) throw new Error("Listing not found");


  const bookingData = {
    customer: userId,
    lender: listing.lenderId || null,
    listing: listingId,
    rentalStartDate,
    dressId: listing.dressId,
    listingId:listing._id,
    rentalEndDate,
    rentalDurationDays,
    size,
    deliveryMethod,
  };

  // Manual booking allowed only for lenders
  if (role === "LENDER" && isManualBooking) {
    bookingData.isManualBooking = true;
    bookingData.manualBookingDescription = manualBookingDescription || "";
  }

  // Shipping-specific fields
  if (deliveryMethod === "Shipping") {
    bookingData.deliveryStatus = "Pending";
  }

  // Pickup-specific fields
  if (deliveryMethod === "Pickup") {
    bookingData.tryOnRequested = body.tryOnRequested || false;
    bookingData.tryOnAllowedByLender = body.tryOnAllowedByLender || false;
    bookingData.tryOnOutcome = body.tryOnOutcome || "ProceededWithRental";
    bookingData.tryOnNotes = body.tryOnNotes || "";


  }

  // Notes
  bookingData.customerNotes = customerNotes || "";
  bookingData.lenderNotes = lenderNotes || "";
  bookingData.adminNotes = adminNotes || "";

  const booking = new Booking(bookingData);
  await booking.save(); 
  
  listing.status = 'booked';
await listing.save();

  // Populate customer and lender details
  await booking.populate([
    { path: "customer", select: "-password -refreshToken" }, 
    { path: "lender", select: "-password -refreshToken" },
    {path:"listing"}
  ]);

  return booking;
};





// GET ALL BOOKINGS
export const getAllBookingsService = async ({ page = 1, limit = 10, query = {}, role, userId }) => {
  let filterQuery = { ...query };

  if (role === "USER") {
    filterQuery.customerId = userId; // user only sees own bookings
  } else if (role === "LENDER") {
    filterQuery.lenderId = userId; // lender only sees own bookings
  } 
  // Admin sees all, can use all filters

  const filter = createFilter(filterQuery, role); // pass role to filter if needed

  const totalBookings = await Booking.countDocuments(filter);

  const bookings = await Booking.find(filter)
    .populate([
      { path: "customer", select: "-password -refreshToken" },
      { path: "lender", select: "-password -refreshToken" },
      { path: "listing" },
    ])
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  const paginationInfo = createPaginationInfo(page, limit, totalBookings);

  return { bookings, paginationInfo };
};




// Get booking by ID with role check
export const getBookingByIdService = async ({ bookingId, userId, role }) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) throw new Error("Invalid booking ID");

  const booking = await Booking.findById(bookingId)
    .populate([
      { path: "customer", select: "-password -refreshToken" },
      { path: "lender", select: "-password -refreshToken" },
      { path: "listing" },
    ]);

  if (!booking) throw new Error("Booking not found");
  return booking;
};

// GET BOOKINGS FOR LOGGED-IN USER
export const getUserBookingsService = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) throw new Error("Invalid user ID");

  const bookings = await Booking.find({ customer: userId })
    .populate("lender", "-password -refreshToken")
    .populate("listing")
    .sort({ createdAt: -1 });

  return bookings;
};


// UPDATE BOOKING SERVICE
export const updateBookingService = async ({ bookingId, userId, role, updateData }) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) throw new Error("Invalid booking ID");

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  // Only allow the user/lender/admin who owns this booking or admin to update
  if (role === "USER" && booking.customer.toString() !== userId) {
    throw new Error("Unauthorized: cannot update this booking");
  }
  if (role === "LENDER" && booking.lender.toString() !== userId) {
    throw new Error("Unauthorized: cannot update this booking");
  }
  // ADMIN can update any booking

  // Update all fields (all roles can update their own bookings)
  Object.assign(booking, updateData);

  await booking.save();

  const populatedBooking = await Booking.findById(booking._id)
    .populate("customer", "-password -refreshToken")
    .populate("lender", "-password -refreshToken")
    .populate("listing");

  return populatedBooking;
};


// DELETE BOOKING
export const deleteBookingService = async (bookingId) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) throw new Error("Invalid booking ID");

  const booking = await Booking.findByIdAndDelete(bookingId);
  if (!booking) throw new Error("Booking not found");

  // Optional: mark listing as available again
  const listing = await Listing.findById(booking.listing);
  if (listing) {
    listing.status = "available";
    await listing.save();
  }

  return booking;
};