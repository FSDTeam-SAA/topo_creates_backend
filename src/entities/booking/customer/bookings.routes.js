import express from "express";
import {

  createBookingController,
  deleteBookingController,
  getAllBookingsController,
  getBookingByIdController,
  getLenderBookingStatsController,
  getMasterDressByNameController,
  getPayoutByBookingIdController,
  getUserBookingsController,
  updateBookingController,

} from "./bookings.controller.js";
import { verifyToken, userMiddleware, userAdminLenderMiddleware, lenderMiddleware, adminLenderMiddleware } from "../../../core/middlewares/authMiddleware.js"; 
import { getAllocatedBookingsForLenderController, getUpcomingBookingsForLenderController } from "../lender/bookings.controller.js";


const router = express.Router();


router.post("/create", verifyToken, userMiddleware, createBookingController);
router.get("/all", verifyToken, userAdminLenderMiddleware, getAllBookingsController);
router.get('/stats',getLenderBookingStatsController)
router.get('/search', getMasterDressByNameController);
router.get('/allocated', verifyToken, lenderMiddleware, getAllocatedBookingsForLenderController);
router.get(
  "/upcoming",
  verifyToken,
  adminLenderMiddleware,
  getUpcomingBookingsForLenderController
);
router.get("/:bookingId", verifyToken, userAdminLenderMiddleware, getBookingByIdController);
// Get bookings of logged-in user

router.get("/user/me", verifyToken, userMiddleware, getUserBookingsController);
// Update booking by ID
router.put("/:id", verifyToken, userAdminLenderMiddleware, updateBookingController);
router.get('/payment/:bookingId', getPayoutByBookingIdController);
// Delete booking by ID
router.delete("/:id", verifyToken, userAdminLenderMiddleware, deleteBookingController);



export default router;










