import express from "express";
import {

  createBookingController,
  deleteBookingController,
  getAllBookingsController,
  getBookingByIdController,
  getLenderBookingStatsController,
  getPayoutByBookingIdController,
  getUserBookingsController,
  updateBookingController,

} from "./bookings.controller.js";
import { verifyToken, userMiddleware, userAdminLenderMiddleware, adminMiddleware } from "../../../core/middlewares/authMiddleware.js"; 


const router = express.Router();


router.post("/create", verifyToken, userMiddleware, createBookingController);
router.get("/all", verifyToken, userAdminLenderMiddleware, getAllBookingsController);
router.get('/stats',getLenderBookingStatsController)

router.get("/:id", verifyToken, userAdminLenderMiddleware, getBookingByIdController);
// Get bookings of logged-in user

router.get("/user/me", verifyToken, userMiddleware, getUserBookingsController);
// Update booking by ID
router.put("/:id", verifyToken, userAdminLenderMiddleware, updateBookingController);
router.get('/payment/:bookingId', getPayoutByBookingIdController);
// Delete booking by ID
router.delete("/:id", verifyToken, userAdminLenderMiddleware, deleteBookingController);


export default router;










