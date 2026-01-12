import mongoose from 'mongoose';
import { Booking } from '../booking.model.js';
import Listing from '../../lender/Listings/listings.model.js';
import { createPaginationInfo } from '../../../lib/pagination.js';
import payOutModel from '../../lender/payOut/payOut.model.js';
import paymentModel from '../../Payment/Booking/payment.model.js';
import MasterDress from '../../admin/Lisitngs/ReviewandMain Site Listing/masterDressModel.js';
import { ChatRoom } from '../../message/chatRoom.model.js';
import promoCodeModel from '../../admin/promoCode/promoCode.model.js';
import promoCodeUsageModel from '../promoCodeUsage.model.js';
import { sendEmail } from '../../../lib/resendEmial.js';
import {
  bookingCreatedTemplate,
  bookingCancelledTemplate
} from '../../../lib/emailTemplates/booking.templates.js';
import User from '../../auth/auth.model.js';

export const createBookingService = async ({ userId, role, body }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      masterdressId,
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
      selectedLender,
      promoCode
    } = body;

    // --- Validate user ---
    const User = mongoose.model('User');
    const user = await User.findById(userId).session(session);

    if (!user || (role === 'USER' && !user.kycVerified)) {
      throw new Error('User KYC not verified or user not found.');
    }

    // --- Fetch Master Dress ---
    if (!mongoose.Types.ObjectId.isValid(masterdressId))
      throw new Error('Invalid MasterDress ID');
    const masterDress =
      await MasterDress.findById(masterdressId).session(session);
    if (!masterDress) throw new Error('Master dress not found');

    // --- Base fees ---
    const insuranceFee = masterDress.insuranceFee || 0;
    const shippingFee = 10;

    // --- Allocate lender ---

    let allocatedLender = null;

    if (deliveryMethod === 'Pickup' && selectedLender) {
      const lender = selectedLender[0];

      // --- Check if the lender is allowed for this dress ---
      if (
        !masterDress.lenderIds.some(
          (id) => id.toString() === lender._id.toString()
        )
      ) {
        throw new Error('Selected lender is not listed for this Master Dress.');
      }

      // --- Find the listing for this lender among the MasterDress listings ---
      const lenderListing = await Listing.findOne({
        _id: { $in: masterDress.listingIds },
        lenderId: new mongoose.Types.ObjectId(lender._id),
        isActive: true,
        approvalStatus: 'approved'
      }).session(session);

      if (!lenderListing)
        throw new Error(
          'Selected lender does not have an active approved listing for this dress.'
        );

      // --- Allocate lender ---
      allocatedLender = {
        lenderId: lender._id,
        email: lender.email,
        distance: lender.distance,
        location: lender.location,
        allocationType: 'LocalPickup',
        price:
          rentalDurationDays <= 4
            ? lenderListing.rentalPrice.fourDays
            : lenderListing.rentalPrice.eightDays,
        allocatedAt: new Date()
      };
    } else if (deliveryMethod === 'Shipping') {
      const listings = await Listing.find({
        _id: { $in: masterDress.listingIds },
        isActive: true,
        approvalStatus: 'approved'
      }).session(session);

      if (!listings.length)
        throw new Error('No active/approved listings found for shipping.');

      let lowestPriceListing =
        rentalDurationDays <= 4
          ? listings.reduce((prev, curr) =>
              curr.rentalPrice.fourDays < prev.rentalPrice.fourDays
                ? curr
                : prev
            )
          : listings.reduce((prev, curr) =>
              curr.rentalPrice.eightDays < prev.rentalPrice.eightDays
                ? curr
                : prev
            );

      allocatedLender = {
        lenderId: lowestPriceListing.lenderId,
        email: lowestPriceListing.lenderEmail || '',
        price:
          rentalDurationDays <= 4
            ? lowestPriceListing.rentalPrice.fourDays
            : lowestPriceListing.rentalPrice.eightDays,
        allocationType: 'Shipping'

        // <-- NO location field at all
      };
    }

    if (!allocatedLender) throw new Error('Failed to allocate lender.');

    // --- Calculate rentalFee & totalAmount ---
    const rentalFee =
      allocatedLender.allocationType === 'Shipping'
        ? masterDress.basePrice
        : masterDress.basePrice + (rentalDurationDays >= 8 ? 15 : 0);

    let totalAmount = rentalFee + insuranceFee + shippingFee;

    // ---------------------------
    // PROMO CODE VALIDATION + DISCOUNT (ADD HERE)
    // ---------------------------
    let discountAmount = 0;
    let appliedPromo = null;

    if (body.promoCode) {
      appliedPromo = await promoCodeModel
        .findOne({
          code: body.promoCode,
          isActive: true,
          expiresAt: { $gte: new Date() }
        })
        .session(session);

      if (!appliedPromo) {
        throw new Error('Invalid or expired promo code.');
      }

      // OPTIONAL: prevent multiple user usage

      const alreadyUsed = await promoCodeUsageModel
        .countDocuments({
          promoCodeId: appliedPromo._id,
          userId: user._id
        })
        .session(session);

      if (appliedPromo.maxUsage && alreadyUsed >= appliedPromo.maxUsage) {
        throw new Error('Promo code usage limit reached.');
      }

      // Calculate discount
      if (appliedPromo.discountType === 'PERCENTAGE') {
        discountAmount = (totalAmount * appliedPromo.discount) / 100;
      } else if (appliedPromo.discountType === 'FLAT') {
        discountAmount = appliedPromo.discount;
      }

      discountAmount = Math.min(discountAmount, totalAmount);

      totalAmount -= discountAmount;
    }

    // --- Prepare booking data ---
    const bookingData = {
      customer: user._id,
      masterdressId: masterDress._id,
      dressName: masterDress.dressName,
      rentalStartDate,
      rentalEndDate,
      rentalDurationDays,
      size,
      deliveryMethod,
      lenderPrice: allocatedLender.price,
      rentalFee,
      insuranceFee,
      shippingFee,
      totalAmount,
      customerNotes: customerNotes || '',
      lenderNotes: lenderNotes || '',
      adminNotes: adminNotes || '',
      allocatedLender
    };

    // Try-on fields only for Pickup
    if (deliveryMethod === 'Pickup') {
      bookingData.tryOnRequested = tryOnRequested || false;
      bookingData.tryOnAllowedByLender = tryOnAllowedByLender || false;
      bookingData.tryOnOutcome = tryOnOutcome || 'ProceededWithRental';
      bookingData.tryOnNotes = tryOnNotes || '';
    }

    // --- Save booking ---
    const booking = new Booking(bookingData);
    await booking.save({ session });

    // Populate customer info
    await booking.populate([
      { path: 'customer', select: '-password -refreshToken' }
    ]);

    if (appliedPromo) {
      const PromoUsage = mongoose.model('PromoCodeUsage');

      await PromoUsage.create(
        [
          {
            promoCodeId: appliedPromo._id,
            userId: user._id,
            bookingId: booking._id,
            discountApplied: discountAmount
          }
        ],
        { session }
      );

      // increase usedCount
      appliedPromo.usedCount += 1;
      await appliedPromo.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    // Send booking created email after successful commit
    try {
      const customer = await User.findById(userId);
      const lender = await User.findById(allocatedLender.lenderId);

      if (customer?.email) {
        await sendEmail({
          to: customer.email,
          subject: 'Booking Confirmation - Pending Lender Approval',
          html: bookingCreatedTemplate(
            customer.firstName || customer.name || 'Customer',
            masterDress.dressName,
            rentalDurationDays.toString(),
            deliveryMethod,
            totalAmount.toFixed(2)
          )
        });
      }

      // Also notify lender
      if (lender?.email) {
        await sendEmail({
          to: lender.email,
          subject: 'New Booking Request for Your Dress',
          html: bookingCreatedTemplate(
            lender.firstName || lender.name || 'Lender',
            masterDress.dressName,
            rentalDurationDays.toString(),
            deliveryMethod,
            totalAmount.toFixed(2)
          )
        });
      }
    } catch (emailError) {
      console.error('Error sending booking created emails:', emailError);
    }

    return booking;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getAllBookingsService = async ({
  page = 1,
  limit = 10,
  query = {},
  role,
  userId
}) => {
  // 1. Build filter object
  const filterQuery = {};

  if (query.search) filterQuery.search = query.search;
  if (query.date) filterQuery.date = query.date;
  if (query.dressId) filterQuery.dressId = query.dressId;
  if (query.customer) filterQuery.customer = query.customer;
  if (query.lender) filterQuery.lender = query.lender;

  // Role filtering
  if (role === 'USER') filterQuery.customer = userId;
  else if (role === 'LENDER') filterQuery.lender = userId;

  // 2. Count
  const totalBookings = await Booking.countDocuments(filterQuery);

  // 3. Fetch bookings
  const bookings = await Booking.find(filterQuery)
    .populate([
      { path: 'customer', select: '-password -refreshToken' },
      { path: 'lender', select: '-password -refreshToken' },
      { path: 'listing' }
    ])
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean(); // important

  // ------ ADD CHATROOM DATA HERE -------
  const bookingIds = bookings.map((b) => b._id);

  const chatRooms = await ChatRoom.find({
    bookingId: { $in: bookingIds }
  }).lean();

  const chatRoomMap = {};
  chatRooms.forEach((cr) => {
    chatRoomMap[cr.bookingId.toString()] = cr;
  });

  // merge chatRoom into each booking
  const bookingsWithChat = bookings.map((b) => ({
    ...b,
    chatRoom: chatRoomMap[b._id.toString()] || null
  }));
  // --------------------------------------

  // Pagination
  const paginationInfo = createPaginationInfo(page, limit, totalBookings);

  return { bookings: bookingsWithChat, paginationInfo };
};

// GET ALL BOOKINGS
// export const getAllBookingsService = async ({ page = 1, limit = 10, query = {}, role, userId }) => {
//   // 1. Build filter object with only defined fields
//   const filterQuery = {};

//   if (query.search) filterQuery.search = query.search;
//   if (query.date) filterQuery.date = query.date;
//   if (query.dressId) filterQuery.dressId = query.dressId;
//   if (query.customer) filterQuery.customer = query.customer;
//   if (query.lender) filterQuery.lender = query.lender;

//   // 2. Apply role-based restrictions
//   if (role === "USER") filterQuery.customer = userId;
//   else if (role === "LENDER") filterQuery.lender = userId;
//   // ADMIN sees all, no restriction

//   // 3. Count total for pagination
//   const totalBookings = await Booking.countDocuments(filterQuery);

//   // 4. Fetch bookings with pagination and populated fields
//   const bookings = await Booking.find(filterQuery)
//     .populate([
//       { path: "customer", select: "-password -refreshToken" },
//       { path: "lender", select: "-password -refreshToken" },
//       { path: "listing" },
//     ])
//     .sort({ createdAt: -1 })
//     .skip((page - 1) * limit)
//     .limit(limit);

//   // 5. Pagination info
//   const paginationInfo = createPaginationInfo(page, limit, totalBookings);

//   return { bookings, paginationInfo };
// };

// Get booking by ID with role check
export const getBookingByIdService = async ({ bookingId, userId, role }) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId))
    throw new Error('Invalid booking ID');

  const booking = await Booking.findById(bookingId).populate([
    { path: 'customer', select: '-password -refreshToken' },
    { path: 'lender', select: '-password -refreshToken' },
    { path: 'listing' }
  ]);

  if (!booking) throw new Error('Booking not found');
  return booking;
};

// GET BOOKINGS FOR LOGGED-IN USER
export const getUserBookingsService = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId))
    throw new Error('Invalid user ID');

  const bookings = await Booking.find({ customer: userId })
    .populate('lender', '-password -refreshToken')
    .populate('listing')
    .sort({ createdAt: -1 });

  return bookings;
};

// UPDATE BOOKING SERVICE
export const updateBookingService = async ({
  bookingId,
  userId,
  role,
  updateData
}) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId))
    throw new Error('Invalid booking ID');

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error('Booking not found');

  // // Only allow the user/lender/admin who owns this booking or admin to update
  // if (role === "USER" && booking.customer.toString() !== userId) {
  //   throw new Error("Unauthorized: cannot update this booking");
  // }
  // if (role === "LENDER" && booking.lender.toString() !== userId) {
  //   throw new Error("Unauthorized: cannot update this booking");
  // }
  // ADMIN can update any booking

  // Update all fields (all roles can update their own bookings)
  Object.assign(booking, updateData);

  await booking.save();

  const populatedBooking = await Booking.findById(booking._id)
    .populate('customer', '-password -refreshToken')
    .populate('lender', '-password -refreshToken')
    .populate('listing');

  return populatedBooking;
};

// DELETE BOOKING
export const deleteBookingService = async (bookingId) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId))
    throw new Error('Invalid booking ID');

  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error('Booking not found');

  const masterDress = await MasterDress.findById(booking.masterdressId);

  // Calculate refund amount
  let refundAmount = booking.totalAmount;
  if (booking.paymentStatus === 'Paid') {
    // Full refund if not yet delivered
    if (
      !['Completed', 'ReceivedByLender', 'Dress Returned'].includes(
        booking.deliveryStatus
      )
    ) {
      refundAmount = booking.totalAmount;
    }
  }

  // Delete booking
  const deletedBooking = await Booking.findByIdAndDelete(bookingId);

  // Send cancellation email
  try {
    const customer = await User.findById(booking.customer);
    const lender = await User.findById(booking.allocatedLender?.lenderId);

    if (customer?.email) {
      await sendEmail({
        to: customer.email,
        subject: 'Booking Cancelled',
        html: bookingCancelledTemplate(
          customer.firstName || customer.name || 'Customer',
          masterDress?.dressName || 'Your Dress',
          'Cancelled by customer',
          refundAmount.toFixed(2)
        )
      });
    }

    if (lender?.email) {
      await sendEmail({
        to: lender.email,
        subject: 'Booking Cancelled by Customer',
        html: bookingCancelledTemplate(
          lender.firstName || lender.name || 'Lender',
          masterDress?.dressName || 'Your Dress',
          'Cancelled by customer',
          '0.00'
        )
      });
    }
  } catch (emailError) {
    console.error('Error sending cancellation emails:', emailError);
  }

  // Optional: mark listing as available again
  const listing = await Listing.findById(booking.listing);
  if (listing) {
    listing.status = 'available';
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
    throw new Error('Booking ID is required');
  }

  const payout = await payOutModel.findOne({ bookingId });
  const payment = await paymentModel.findOne({ bookingId });
  if (!payment) {
    throw new Error('No payment found for this booking');
  }

  if (!payout) {
    throw new Error('No payout request found for this booking');
  }

  return { payout, payment };
};

export const getLenderBookingStatsService = async () => {
  // Example: Fetch all bookings and payouts regardless of lender
  const allBookings = await paymentModel.find({ type: 'booking' });
  // console.log("ll",allBookings);
  const totalBookingsCount = allBookings.length;
  const totalBookingsAmount = allBookings.reduce(
    (sum, b) => sum + (b.amount || 0),
    0
  );

  const paidBookings = allBookings.filter((b) => b.status === 'Paid');
  const paidBookingCount = paidBookings.length;
  const paidBookingsAmount = paidBookings.reduce(
    (sum, b) => sum + (b.amount || 0),
    0
  );

  const paidPayouts = await payOutModel.find({ status: 'paid' });
  const totalProfit = paidPayouts.reduce(
    (sum, p) => sum + (p.bookingAmount - p.requestedAmount),
    0
  );

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
    dressName: { $regex: `^${dressName}$`, $options: 'i' } // exact match ignoring case
  }).lean();

  return dresses;
};
