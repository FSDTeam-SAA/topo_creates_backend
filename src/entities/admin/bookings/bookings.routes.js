// import express from "express";
// // import {
// //   getAllBookingsAdmin,
// //   getBookingByIdAdmin,
// //   updateBookingAdmin,
// //   cancelBookingAdmin,
// //   refundBookingAdmin,
// //   createManualBookingByAdmin,
// //   // You might also have admin-specific dispute actions here or in a separate dispute module
// // } from "./booking.controller.js"; // Assumes controller is in the same folder
// // import {
// //   verifyToken,
// //   adminMiddleware,
// // } from "../../../../core/middlewares/authMiddleware.js"; // Adjust path

// const router = express.Router();

// // All routes in this file are protected and require admin role
// router.use(verifyToken, adminMiddleware);

// /**
//  * @route   GET /api/admin/bookings
//  * @desc    Admin gets a list of all bookings on the platform
//  * @access  Private (Admin)
//  */
// router.get("/", getAllBookingsAdmin);

// /**
//  * @route   GET /api/admin/bookings/:bookingId
//  * @desc    Admin gets a specific booking by ID
//  * @access  Private (Admin)
//  */
// router.get("/:bookingId", getBookingByIdAdmin);

// /**
//  * @route   PUT /api/admin/bookings/:bookingId
//  * @desc    Admin updates any detail of a specific booking
//  * @access  Private (Admin)
//  */
// router.put("/:bookingId", updateBookingAdmin);

// /**
//  * @route   POST /api/admin/bookings/:bookingId/cancel
//  * @desc    Admin cancels a booking
//  * @access  Private (Admin)
//  */
// router.post("/:bookingId/cancel", cancelBookingAdmin);

// /**
//  * @route   POST /api/admin/bookings/:bookingId/refund
//  * @desc    Admin processes a refund for a booking
//  * @access  Private (Admin)
//  */
// router.post("/:bookingId/refund", refundBookingAdmin);

// /**
//  * @route   POST /api/admin/bookings/manual
//  * @desc    Admin creates a booking manually
//  * @access  Private (Admin)
//  */
// router.post("/manual", createManualBookingByAdmin);

// export default router;