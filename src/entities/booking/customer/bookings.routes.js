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
  validatePromoCodeController,

} from "./bookings.controller.js";
import { verifyToken, userMiddleware, lenderMiddleware, userAdminLenderSuperAdminMiddleware, adminLenderSuperadminMiddleware } from "../../../core/middlewares/authMiddleware.js"; 
import { acceptOrRejectBookingController, createManualBookingController, getAllocatedBookingsForLenderController, getUpcomingBookingsForLenderController } from "../lender/bookings.controller.js";


const router = express.Router();


router.post("/create", verifyToken, userMiddleware, createBookingController);
router.post('/manual', verifyToken, adminLenderSuperadminMiddleware, createManualBookingController);
router.post('/accept-reject',verifyToken, lenderMiddleware, acceptOrRejectBookingController);
router.get("/all", verifyToken, userAdminLenderSuperAdminMiddleware, getAllBookingsController);
router.post("/promo-validate", validatePromoCodeController);
router.get('/stats',getLenderBookingStatsController)
router.get('/search', getMasterDressByNameController);
router.get('/allocated', verifyToken, lenderMiddleware, getAllocatedBookingsForLenderController);

router.get(
  "/upcoming",
  verifyToken,
  adminLenderSuperadminMiddleware,
  getUpcomingBookingsForLenderController
);

router.get("/:bookingId", verifyToken, userAdminLenderSuperAdminMiddleware, getBookingByIdController);
// Get bookings of logged-in user

router.get("/user/me", verifyToken, userMiddleware, getUserBookingsController);

// Update booking by ID
router.put("/:id", verifyToken, userAdminLenderSuperAdminMiddleware, updateBookingController);

router.get('/payment/:bookingId', getPayoutByBookingIdController);

// Delete booking by ID
router.delete("/:id", verifyToken, userAdminLenderSuperAdminMiddleware, deleteBookingController);



export default router;










