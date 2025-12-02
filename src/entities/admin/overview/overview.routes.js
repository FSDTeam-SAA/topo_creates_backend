import express from "express";
import { superAdminOrAdminMiddleware, verifyToken } from "../../../core/middlewares/authMiddleware.js";
import { getAdminDashboardStats, getRevenueTrendsController } from "./overview.controller.js";


const router = express.Router();


router.get("/dashboard/stats", verifyToken, superAdminOrAdminMiddleware, getAdminDashboardStats);
router.get("/dashboard/revenue-trends", verifyToken, superAdminOrAdminMiddleware, getRevenueTrendsController);
// router.get("/dashboard/top-lenders", verifyToken, superAdminOrAdminMiddleware, topLendersController);
// router.get("/dashboard/top-dresses", verifyToken, superAdminOrAdminMiddleware, topDressesController);


export default router;

