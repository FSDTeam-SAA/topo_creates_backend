import { generateResponse } from "../../../lib/responseFormate.js";
import { acceptOrRejectBookingService, createManualBookingService, getAllocatedBookingsForLenderService, getUpcomingBookingsForLenderService } from "./booking.service.js";

export const getAllocatedBookingsForLenderController = async (req, res) => {
  try {
    const lenderId = req.user._id; // logged-in lender
    const role = req.user.role;

    if (role !== "LENDER") {
      return res.status(403).json({
        status: false,
        message: "Only lenders can view allocated bookings",
      });
    }

    const result = await getAllocatedBookingsForLenderService(
      lenderId,
      req.query
    );

    return res.status(200).json({
      status: true,
      message: "Allocated bookings fetched successfully",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};


// upcoming bookings controller

export const getUpcomingBookingsForLenderController = async (req, res) => {
  try {
    const lenderId = req.user._id;
    const role = req.user.role;

    if (role !== "LENDER") {
      return res.status(403).json({
        status: false,
        message: "Only lenders can view upcoming bookings"
      });
    }

    const result = await getUpcomingBookingsForLenderService(lenderId, req.query);

    return res.status(200).json({
      status: true,
      message: "Upcoming bookings fetched successfully",
      data: result
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message
    });
  }
};


 // auto pay after accepting the booking 

 export const acceptOrRejectBookingController = async (req, res) => {
  try {
    const { bookingId, action } = req.body;
    const lenderId = req.user._id;

    const result = await acceptOrRejectBookingService({
      bookingId,
      lenderId,
      action
    });

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};


// manual booking


export const createManualBookingController = async (req, res) => {
  try {
    const userId = req.user._id;

    const booking = await createManualBookingService({ userId, body: req.body });

    generateResponse(res, 201, true, 'Manual booking created successfully', booking);
  } catch (err) {
    console.error(err);
    // If Stripe fails, err.message may include Stripe-specific info
    generateResponse(res, 400, false, err.message || 'Failed to create manual booking');
  }
};
