import express from "express";
import {
  getAllLenderBookings,
  getLenderBookingById,
  createManualBooking,
  confirmBooking,
  fulfillOrder,
  generateShippingLabel,
  markAsShipped,
  markAsPickedUp,
  recordTryOnOutcome,
  markAsReceived,
  cancelBooking,
  raiseDispute,
} from "../controllers/lenderBooking.controller.js";

import { verifyToken } from "../middlewares/auth.middleware.js";
import { lenderMiddleware } from "../middlewares/role.middleware.js";
import { canAccessBooking } from "../middlewares/bookingAccess.middleware.js";

const router = express.Router();

// Apply base authentication and role-based access for all routes
router.use(verifyToken, lenderMiddleware);

// GET /api/v1/lender/bookings
router.get("/", getAllLenderBookings);

// GET /api/v1/lender/bookings/:bookingId
router.get("/:bookingId", canAccessBooking, getLenderBookingById);

// POST /api/v1/lender/bookings/manual
router.post("/manual", createManualBooking);

// PATCH /api/v1/lender/bookings/:bookingId/confirm
router.patch("/:bookingId/confirm", canAccessBooking, confirmBooking);

// PATCH /api/v1/lender/bookings/:bookingId/fulfill-order
router.patch("/:bookingId/fulfill-order", canAccessBooking, fulfillOrder);

// POST /api/v1/lender/bookings/:bookingId/generate-shipping-label
router.post("/:bookingId/generate-shipping-label", canAccessBooking, generateShippingLabel);

// PATCH /api/v1/lender/bookings/:bookingId/mark-shipped
router.patch("/:bookingId/mark-shipped", canAccessBooking, markAsShipped);

// PATCH /api/v1/lender/bookings/:bookingId/mark-picked-up
router.patch("/:bookingId/mark-picked-up", canAccessBooking, markAsPickedUp);

// PATCH /api/v1/lender/bookings/:bookingId/record-try-on-outcome
router.patch("/:bookingId/record-try-on-outcome", canAccessBooking, recordTryOnOutcome);

// PATCH /api/v1/lender/bookings/:bookingId/mark-received
router.patch("/:bookingId/mark-received", canAccessBooking, markAsReceived);

// PATCH /api/v1/lender/bookings/:bookingId/cancel
router.patch("/:bookingId/cancel", canAccessBooking, cancelBooking);

// POST /api/v1/lender/bookings/:bookingId/disputes
router.post("/:bookingId/disputes", canAccessBooking, raiseDispute);

export default router;
