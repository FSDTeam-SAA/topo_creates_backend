import { generateResponse } from '../../../lib/responseFormate.js';
import promoCodeModel from '../../admin/promoCode/promoCode.model.js';
import { createBookingService, deleteBookingService, getAllBookingsService, getBookingByIdService, getLenderBookingStatsService, getMasterDressByNameService, getPayoutByBookingIdService, getUserBookingsService, updateBookingService} from '../customer/bookings.service.js';


export const createBookingController = async (req, res) => {
  try {
    const userId = req.user._id;
    const role = req.user.role; 

    const booking = await createBookingService({
      userId,
      role,
      body: req.body,
    });

  
    generateResponse(res, 201, true, "Booking created successfully for the user", booking);
  } catch (err) {
    console.error(err);
    generateResponse(res, 400, false, err.message || "Failed to create booking");
  }
};

// GET ALL
export const getAllBookingsController = async (req, res) => {
  const { page = 1, limit = 10, search, date, lender, dressId, customer } = req.query;
  const role = req.user.role;
  const userId = req.user._id;

  console.log("userId", userId);

  // Build query object with only defined values
  const queryObj = {};
  if (search) queryObj.search = search;
  if (date) queryObj.date = date;
  if (dressId) queryObj.dressId = dressId;
  if (lender) queryObj.lender = lender;
  if (customer) queryObj.customer = customer;

  const { bookings, paginationInfo } = await getAllBookingsService({
    page: Number(page),
    limit: Number(limit),
    query: queryObj,
    role,
    userId,
  });

  generateResponse(res, 200, true, "Bookings fetched successfully", { bookings, paginationInfo });
};


// GET BY BOOKING ID
export const getBookingByIdController = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const userId = req.user.id; // logged-in user
    const role = req.user.role; // role: USER, LENDER, ADMIN

    const booking = await getBookingByIdService({ bookingId, userId, role });
    generateResponse(res, 200, true, "Booking fetched successfully", booking);
  } catch (err) {
    generateResponse(res, 404, false, err.message);
  }
};


// GET BOOKINGS OF LOGGED-IN USER
export const getUserBookingsController = async (req, res) => {
  try {
    const bookings = await getUserBookingsService(req.user.id);
    generateResponse(res, 200, true, "User bookings fetched successfully", bookings);
  } catch (err) {
    generateResponse(res, 500, false, err.message);
  }
};




// UPDATE BOOKING CONTROLLER
export const updateBookingController = async (req, res) => {
  try {
    const userId = req.user.id;
    // const role = req.user.role; 
    const bookingId = req.params.id;

    const booking = await updateBookingService({ bookingId, userId, updateData: req.body });

    generateResponse(res, 200, true, "Booking updated successfully", booking);
  } catch (err) {
    generateResponse(res, 400, false, err.message);
  }
};

export const getPayoutByBookingIdController = async (req, res) => {
  try {
    // Take bookingId from params instead of query
    const { bookingId } = req.params;

    const payout = await getPayoutByBookingIdService(bookingId);

    generateResponse(res, 200, true, "Payout request fetched successfully", payout);
  } catch (err) {
    console.error(err);
    generateResponse(res, 400, false, err.message || "Failed to fetch payout request");
  }
};




// DELETE BOOKING
export const deleteBookingController = async (req, res) => {
  try {
    const booking = await deleteBookingService(req.params.id);
    generateResponse(res, 200, true, "Booking deleted successfully", booking);
  } catch (err) {
    generateResponse(res, 400, false, err.message);
  }
};


// get lender dashboard stats 
export const getLenderBookingStatsController = async (req, res) => {
  try {
    const stats = await getLenderBookingStatsService(); 

    generateResponse(res, 200, true, "Lender booking stats fetched successfully", stats);
  } catch (err) {
    console.error(err);
    generateResponse(res, 400, false, err.message || "Failed to fetch stats");
  }
};


// fetch dress by name 

export const getMasterDressByNameController = async (req, res, next) => {
  try {
    const { dressName } = req.query;

    if (!dressName) {
      return res.status(400).json({
        success: false,
        message: "dressName query parameter is required",
      });
    }

    const masterDresses = await getMasterDressByNameService(dressName);

    if (!masterDresses || masterDresses.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No master dress found with this name",
      });
    }

    res.status(200).json({
      success: true,
      data: masterDresses,
    });
  } catch (err) {
    next(err);
  }
};


// apply promo code 

export const validatePromoCodeController = async (req, res) => {
  try {
    const { promoCode } = req.body;

    if (!promoCode) {
      return res.status(400).json({
        status: false,
        message: "Promo code is required"
      });
    }

    const appliedPromo = await promoCodeModel.findOne({
      code: promoCode.trim(),
      isActive: true,
      expiresAt: { $gte: new Date() }
    });

    if (!appliedPromo) {
      return res.status(404).json({
        status: false,
        message: "Invalid or expired promo code"
      });
    }

    return res.status(200).json({
      status: true,
      message: "Promo code applied successfully",
      data: {
        id: appliedPromo._id,
        code: appliedPromo.code,
        discountType: appliedPromo.discountType,
        discountValue: appliedPromo.discount,
        expiresAt: appliedPromo.expiresAt
      }
    });
  } catch (error) {
    console.error("Promo validation error:", error);

    return res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message
    });
  }
};