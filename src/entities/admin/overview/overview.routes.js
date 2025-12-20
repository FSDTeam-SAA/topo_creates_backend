import express from "express";
import { superAdminOrAdminMiddleware, verifyToken } from "../../../core/middlewares/authMiddleware.js";
import { getAdminDashboardStats, getBookingByIdController, getBookingStatsController, getPlatformStats, getRevenueTrendsController, topDressesController, topLendersController } from "./overview.controller.js";
import { getBookingFinanceStatsController, lenderPayoutStats, subscriptionAnalytics} from "./finance.controller.js";


const router = express.Router();


router.get("/dashboard/stats", verifyToken, superAdminOrAdminMiddleware, getAdminDashboardStats);
router.get("/dashboard/revenue-trends", verifyToken, superAdminOrAdminMiddleware, getRevenueTrendsController);
router.get("/dashboard/top-lenders", verifyToken, superAdminOrAdminMiddleware, topLendersController);
router.get("/dashboard/top-dresses", verifyToken, superAdminOrAdminMiddleware, topDressesController);
router.get("/dashboard/bookings/stats",getBookingStatsController)
router.get("/dashboard/finance/booking-revenue",getBookingFinanceStatsController)
router.get("/dashboard/finance/payout/stats",lenderPayoutStats)
router.get("/dashboard/finance/subscriptionAnalytics",subscriptionAnalytics)
router.get("/dashboard/bookings/:id", getBookingByIdController);
router.get("/dashboard/finance/revenue-breakdown", getPlatformStats);
export default router;

