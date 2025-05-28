import * as bookingService from "./bookings.service.js";
import { generateResponse } from "../../../lib/responseFormate.js";

export const calculateBookingPrice = async (req, res, next) => {
  try {
    const pricing = await bookingService.calculatePrice(req.body);
    generateResponse(res, 200, "success", "Price calculated successfully", pricing);
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req, res) => {
  try {
    const customerId = req.user?._id;
    if (!customerId) return generateResponse(res, 401, false, 'Unauthorized');

    const { listingId, rentalStartDate, rentalEndDate } = req.body;
    if (!listingId || !rentalStartDate || !rentalEndDate) {
      return generateResponse(res, 400, false, 'Missing required booking fields');
    }

    const bookingData = {
      ...req.body,
      customer: customerId,
    };

    const newBooking = await bookingService.createBookingService(bookingData);
    return generateResponse(res, 200, true, 'Booking created successfully', newBooking);
  } catch (error) {
    console.error('Create booking error:', error);
    return generateResponse(res, 500, false, 'Failed to create booking');
  }
};


export const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getBookingsByCustomer(req.user.id);
    generateResponse(res, 200, "success", "Bookings retrieved successfully", bookings);
  } catch (error) {
    next(error);
  }
};

export const getMyBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.bookingId, req.user.id);
    generateResponse(res, 200, "success", "Booking detail retrieved", booking);
  } catch (error) {
    next(error);
  }
};

export const markBookingReturnedByCustomer = async (req, res, next) => {
  try {
    const updatedBooking = await bookingService.markReturned(req.params.bookingId, req.user.id, req.body);
    generateResponse(res, 200, "success", "Booking marked as returned", updatedBooking);
  } catch (error) {
    next(error);
  }
};

export const cancelBookingByCustomer = async (req, res, next) => {
  try {
    const result = await bookingService.cancelBooking(req.params.bookingId, req.user.id);
    generateResponse(res, 200, "success", "Booking cancelled", result);
  } catch (error) {
    next(error);
  }
};

export const openDisputeByCustomer = async (req, res, next) => {
  try {
    const dispute = await bookingService.raiseDispute(req.params.bookingId, req.user.id, req.body);
    generateResponse(res, 201, "success", "Dispute created", dispute);
  } catch (error) {
    next(error);
  }
};

export const confirmPickupByCustomer = async (req, res, next) => {
  try {
    const updated = await bookingService.confirmPickupTime(req.params.bookingId, req.user.id, req.body);
    generateResponse(res, 200, "success", "Pickup time confirmed", updated);
  } catch (error) {
    next(error);
  }
};
