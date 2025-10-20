
import mongoose from "mongoose";
import { Booking } from "../booking.model.js";
import Listing from "../../lender/Listings/listings.model.js";
import { createFilter, createPaginationInfo } from "../../../lib/pagination.js";
import payOutModel from "../../lender/payOut/payOut.model.js";
import paymentModel from "../../Payment/Booking/payment.model.js";
import MasterDress from "../../admin/Lisitngs/ReviewandMain Site Listing/masterDressModel.js";


export const createBookingService = async ({ userId, role, body }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      rentalStartDate,
      rentalEndDate,
      rentalDurationDays,
      size,
      deliveryMethod,
      customerNotes,
      lenderNotes,
      adminNotes,
      tryOnRequested,
      tryOnAllowedByLender,
      tryOnOutcome,
      tryOnNotes,
    } = body;

    // Validate user
    const User = mongoose.model('User');
    const user = await User.findById(userId).session(session);
    if (!user || (role === 'USER' && !user.kycVerified)) {
      throw new Error('User KYC not verified or user not found.');
    }

    // Fetch Master Dress
    if (!mongoose.Types.ObjectId.isValid(body.masterdressId)) {
      throw new Error('Invalid MasterDress ID');
    }
    const masterDress = await MasterDress.findById(body.masterdressId).session(session);
    if (!masterDress) throw new Error('Master dress not found');

    // Calculate rentalFee
    let rentalFee = masterDress.basePrice;
    if (rentalDurationDays >= 8) rentalFee += 15; // extra $15 for 8+ days

    // Insurance fee from masterDress
    const insuranceFee = masterDress.insuranceFee || 0;

    const totalAmount = rentalFee + insuranceFee + 10; // + $10 shippingFee

    // Prepare booking data
    const bookingData = {
      customer: user._id,
      masterdressId: masterDress._id,
      dressName: masterDress.dressName,
      rentalStartDate,
      rentalEndDate,
      rentalDurationDays,
      size,
      deliveryMethod,        // always store
      rentalFee,
      insuranceFee,
      totalAmount,
      customerNotes: customerNotes || '',
      lenderNotes: lenderNotes || '',
      adminNotes: adminNotes || '',
      shippingFee: 10,       // default fixed
    };

    // Only save try-on info for Pickup
    if (deliveryMethod === 'Pickup') {
      bookingData.tryOnRequested = tryOnRequested || false;
      bookingData.tryOnAllowedByLender = tryOnAllowedByLender || false;
      bookingData.tryOnOutcome = tryOnOutcome || 'ProceededWithRental';
      bookingData.tryOnNotes = tryOnNotes || '';
    }

    // Create booking
    const booking = new Booking(bookingData);
    await booking.save({ session });

    // Populate customer
    await booking.populate([
      { path: 'customer', select: '-password -refreshToken' }
    ]);

    await session.commitTransaction();
    session.endSession();

    return booking;

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};





// GET ALL BOOKINGS
export const getAllBookingsService = async ({ page = 1, limit = 10, query = {}, role, userId }) => {
  // 1. Build filter object with only defined fields
  const filterQuery = {};

  if (query.search) filterQuery.search = query.search;
  if (query.date) filterQuery.date = query.date;
  if (query.dressId) filterQuery.dressId = query.dressId;
  if (query.customer) filterQuery.customer = query.customer;
  if (query.lender) filterQuery.lender = query.lender;

  // 2. Apply role-based restrictions
  if (role === "USER") filterQuery.customer = userId;
  else if (role === "LENDER") filterQuery.lender = userId;
  // ADMIN sees all, no restriction

  // 3. Count total for pagination
  const totalBookings = await Booking.countDocuments(filterQuery);

  // 4. Fetch bookings with pagination and populated fields
  const bookings = await Booking.find(filterQuery)
    .populate([
      { path: "customer", select: "-password -refreshToken" },
      { path: "lender", select: "-password -refreshToken" },
      { path: "listing" },
    ])
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // 5. Pagination info
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


/**
 * Fetch payout request by bookingId
 * @param {String} bookingId
 * @returns {Object} payout request data
 */
export const getPayoutByBookingIdService = async (bookingId) => {
  if (!bookingId) {
    throw new Error("Booking ID is required");
  }

  const payout = await payOutModel.findOne({ bookingId });
    const payment = await paymentModel.findOne({ bookingId });
  if (!payment) {
    throw new Error("No payment found for this booking");
  }

  if (!payout) {
    throw new Error("No payout request found for this booking");
  }

  return {payout,payment};
};



export const getLenderBookingStatsService = async () => {
  // Example: Fetch all bookings and payouts regardless of lender
  const allBookings = await paymentModel.find({ type: "booking" });
  // console.log("ll",allBookings);
  const totalBookingsCount = allBookings.length;
  const totalBookingsAmount = allBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  const paidBookings = allBookings.filter((b) => b.status === "Paid");
  const paidBookingCount = paidBookings.length;
  const paidBookingsAmount = paidBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  const paidPayouts = await payOutModel.find({ status: "paid" });
  const totalProfit = paidPayouts.reduce((sum, p) => sum + (p.bookingAmount - p.requestedAmount), 0);

  return {
    totalBookingsCount,
    totalBookingsAmount,
    paidBookingCount,
    paidBookingsAmount,
    totalProfit
  };
};


// fetch dress with dress name

export const getMasterDressByNameService = async (dressName) => {
  // Case-insensitive search
  const dresses = await MasterDress.find({
    dressName: { $regex: `^${dressName}$`, $options: 'i' }, // exact match ignoring case
   
  }).lean();

  return dresses;
};