import express from "express";
import {
  getAllBookings,
  getBookingById,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
  processRefund,
  updateAdminNotes,
} from "../controllers/adminBooking.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// Apply base authentication and admin role check
router.use(verifyToken, adminMiddleware);

// GET /api/v1/admin/bookings
router.get("/", getAllBookings);

// GET /api/v1/admin/bookings/:bookingId
router.get("/:bookingId", getBookingById);

// PATCH /api/v1/admin/bookings/:bookingId
router.patch("/:bookingId", updateBooking); // caution use only for super admin or internal tools

// PATCH /api/v1/admin/bookings/:bookingId/status
router.patch("/:bookingId/status", updateBookingStatus);

// PATCH /api/v1/admin/bookings/:bookingId/cancel
router.patch("/:bookingId/cancel", cancelBooking);

// POST /api/v1/admin/bookings/:bookingId/refund
router.post("/:bookingId/refund", processRefund);

// PATCH /api/v1/admin/bookings/:bookingId/update-notes
router.patch("/:bookingId/update-notes", updateAdminNotes);

export default router;
