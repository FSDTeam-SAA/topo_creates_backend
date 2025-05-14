import express from "express";
import {
  // calculateBookingPrice,
  createBooking,
  // getMyBookings,
  // getMyBookingById,
  // markBookingReturnedByCustomer,
  // cancelBookingByCustomer,
  // openDisputeByCustomer,
} from "./bookings.controller.js";
import { verifyToken, userMiddleware } from "../../../core/middlewares/authMiddleware.js"; 


const router = express.Router();

router.use(verifyToken, userMiddleware);

// router.post("/calculate-price", calculateBookingPrice);
router.post("/", createBooking);
// router.get("/my-bookings", getMyBookings);
// router.get("/my-bookings/:bookingId", getMyBookingById);

// router.post("/my-bookings/:bookingId/mark-returned", markBookingReturnedByCustomer);
// router.post("/my-bookings/:bookingId/cancel", cancelBookingByCustomer);
// router.post("/my-bookings/:bookingId/dispute", openDisputeByCustomer);
//router.post("/my-bookings/:bookingId/request-try-on", requestTryOnByCustomer);

export default router;













// import express from "express";
// // import { userMiddleware, verifyToken } from "../../../core/middlewares/authMiddleware";
// // // import {
// // //   calculateBookingPrice,
// // //   createBooking,
// // //   getMyBookings,
// // //   getMyBookingById,
// // //   markBookingReturnedByCustomer,
// // //   cancelBookingByCustomer,
// // //   openDisputeByCustomer, // Renamed for clarity
// // // } from "./booking.controller.js"; // Assumes controller is in the same folder

// const router = express.Router();

// // All routes in this file are protected and require customer role
// router.use(verifyToken, userMiddleware);

// /**
//  * @route   POST /api/customer/bookings/calculate-price
//  * @desc    Calculate the price for a potential booking
//  * @access  Private (Customer)
//  */
// router.post("/calculate-price", calculateBookingPrice);

// /**
//  * @route   POST /api/customer/bookings
//  * @desc    Create a new booking (initiates payment process)
//  * @access  Private (Customer)
//  */
// router.post("/", createBooking);

// /**
//  * @route   GET /api/customer/bookings/my-bookings
//  * @desc    Get all bookings for the logged-in customer
//  * @access  Private (Customer)
//  */
// router.get("/my-bookings", getMyBookings);

// /**
//  * @route   GET /api/customer/bookings/my-bookings/:bookingId
//  * @desc    Get a specific booking by ID for the logged-in customer
//  * @access  Private (Customer)
//  */
// router.get("/my-bookings/:bookingId", getMyBookingById);

// /**
//  * @route   POST /api/customer/bookings/my-bookings/:bookingId/mark-returned
//  * @desc    Customer marks a rental item as returned/shipped back
//  * @access  Private (Customer)
//  */
// router.post("/my-bookings/:bookingId/mark-returned", markBookingReturnedByCustomer);

// /**
//  * @route   POST /api/customer/bookings/my-bookings/:bookingId/cancel
//  * @desc    Customer requests to cancel a booking
//  * @access  Private (Customer)
//  */
// router.post("/my-bookings/:bookingId/cancel", cancelBookingByCustomer);

// /**
//  * @route   POST /api/customer/bookings/my-bookings/:bookingId/dispute
//  * @desc    Customer opens a dispute for a specific booking
//  * @access  Private (Customer)
//  */
// router.post("/my-bookings/:bookingId/dispute", openDisputeByCustomer);

// export default router;