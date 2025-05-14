// import express from "express";
// // import {
// //   getLenderBookings,
// //   getLenderBookingById,
// //   updateLenderBookingStatus,
// //   confirmLenderPickup,
// //   recordLenderTryOnOutcome,
// //   generateLenderShippingLabel,
// //   createManualBookingByLender,
// //   openDisputeByLender, // Renamed for clarity
// // } from "./booking.controller.js"; // Assumes controller is in the same folder
// // import {
// //   verifyToken,
// //   lenderMiddleware,
// // } from "../../../../core/middlewares/authMiddleware.js"; // Adjust path

// const router = express.Router();

// // All routes in this file are protected and require lender role
// router.use(verifyToken, lenderMiddleware);

// /**
//  * @route   GET /api/lender/bookings
//  * @desc    Get all bookings related to the logged-in lender's listings
//  * @access  Private (Lender)
//  */
// router.get("/", getLenderBookings);

// /**
//  * @route   GET /api/lender/bookings/:bookingId
//  * @desc    Get a specific booking by ID related to the lender's listings
//  * @access  Private (Lender)
//  */
// router.get("/:bookingId", getLenderBookingById);

// /**
//  * @route   PUT /api/lender/bookings/:bookingId/status
//  * @desc    Lender updates the status of a booking (e.g., shipped, received return)
//  * @access  Private (Lender)
//  */
// router.put("/:bookingId/status", updateLenderBookingStatus);

// /**
//  * @route   POST /api/lender/bookings/:bookingId/confirm-pickup
//  * @desc    Lender confirms customer has picked up the item for local pickup
//  * @access  Private (Lender)
//  */
// router.post("/:bookingId/confirm-pickup", confirmLenderPickup);

// /**
//  * @route   POST /api/lender/bookings/:bookingId/record-try-on
//  * @desc    Lender records the outcome of a try-on session
//  * @access  Private (Lender)
//  */
// router.post("/:bookingId/record-try-on", recordLenderTryOnOutcome);

// /**
//  * @route   POST /api/lender/bookings/:bookingId/generate-shipping-label
//  * @desc    Lender generates a shipping label for an order
//  * @access  Private (Lender)
//  */
// router.post("/:bookingId/generate-shipping-label", generateLenderShippingLabel);

// /**
//  * @route   POST /api/lender/bookings/manual
//  * @desc    Lender creates a booking manually
//  * @access  Private (Lender)
//  */
// router.post("/manual", createManualBookingByLender);

// /**
//  * @route   POST /api/lender/bookings/:bookingId/dispute
//  * @desc    Lender opens a dispute for a specific booking
//  * @access  Private (Lender)
//  */
// router.post("/:bookingId/dispute", openDisputeByLender);

// export default router;