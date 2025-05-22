import express from "express";
import {
  calculateBookingPrice,
  createBooking,
  getMyBookings,
  getMyBookingById,
  markBookingReturnedByCustomer,
  cancelBookingByCustomer,
  openDisputeByCustomer,
  confirmPickupByCustomer
} from "./bookings.controller.js";
import { verifyToken, userMiddleware } from "../../../core/middlewares/authMiddleware.js"; 


const router = express.Router();


router.post("/calculate-price", calculateBookingPrice);
router.post("/", verifyToken, userMiddleware, createBooking);
router.get("/my-bookings", getMyBookings);
router.get("/my-bookings/:bookingId", getMyBookingById);
router.post("/my-bookings/:bookingId/mark-returned", markBookingReturnedByCustomer);
router.post("/my-bookings/:bookingId/cancel", cancelBookingByCustomer);
router.post("/my-bookings/:bookingId/dispute", openDisputeByCustomer);
router.post("/my-bookings/:bookingId/confirm-pickup-time", confirmPickupByCustomer);

export default router;










