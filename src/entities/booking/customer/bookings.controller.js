import { generateResponse } from '../../../lib/responseFormate.js';
import { createBookingService, deleteBookingService, getAllBookingsService, getBookingByIdService, getUserBookingsService, updateBookingService} from '../customer/bookings.service.js';

export const createBookingController = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role; 

    const booking = await createBookingService({
      userId,
      role,
      body: req.body,
    });

  
    generateResponse(res, 201, true, "Booking created successfully", booking);
  } catch (err) {
    console.error(err);
    generateResponse(res, 400, false, err.message || "Failed to create booking");
  }
};


//get all bookings 

// GET ALL
export const getAllBookingsController = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, date, lenderId, dressId, customerId } = req.query;
    const role = req.user.role;
    const userId = req.user.id;

    const { bookings, paginationInfo } = await getAllBookingsService({
      page,
      limit,
      query: { search, date, lenderId, dressId, customerId },
      role,
      userId,
    });

    generateResponse(res, 200, true, "Bookings fetched successfully", { bookings, paginationInfo });
  } catch (err) {
    generateResponse(res, 500, false, err.message);
  }
};



// GET BY BOOKING ID
export const getBookingByIdController = async (req, res) => {
  try {
    const bookingId = req.params.id;
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
    const role = req.user.role; 
    const bookingId = req.params.id;

    const booking = await updateBookingService({ bookingId, userId, role, updateData: req.body });

    generateResponse(res, 200, true, "Booking updated successfully", booking);
  } catch (err) {
    generateResponse(res, 400, false, err.message);
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