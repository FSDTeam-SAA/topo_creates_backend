import express from "express";
import {

  createBookingController,
  deleteBookingController,
  getAllBookingsController,
  getBookingByIdController,
  getUserBookingsController,
  updateBookingController,

} from "./bookings.controller.js";
import { verifyToken, userMiddleware, userAdminLenderMiddleware } from "../../../core/middlewares/authMiddleware.js"; 


const router = express.Router();


router.post("/create", verifyToken, userMiddleware, createBookingController);
router.get("/all", verifyToken, userAdminLenderMiddleware, getAllBookingsController);
router.get("/:id", verifyToken, userAdminLenderMiddleware, getBookingByIdController);
// Get bookings of logged-in user
router.get("/user/me", verifyToken, userMiddleware, getUserBookingsController);
// Update booking by ID
router.put("/:id", verifyToken, userAdminLenderMiddleware, updateBookingController);

// Delete booking by ID
router.delete("/:id", verifyToken, userAdminLenderMiddleware, deleteBookingController);

export default router;










