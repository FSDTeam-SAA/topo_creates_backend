import express from "express";
import { lenderMiddleware, superAdminOrAdminMiddleware, verifyToken } from "../../../core/middlewares/authMiddleware.js";
import { createPayoutController, getAllPayoutsController, getPayoutByIdController, getPayoutsByLenderController, transferPayout } from "./payOut.controller.js";


const router = express.Router();

/**
 * =====================
 * LENDER ROUTES
 * =====================
 */

// 1. Lender creates a payout request
// POST /api/payouts
router.post("/request", verifyToken, lenderMiddleware, createPayoutController);

// 2. Lender views all their payouts
// GET /api/payouts/my
router.get("/my", verifyToken, getPayoutsByLenderController);

// 3. Lender views a specific payout
// GET /api/payouts/my/:id
router.get("/my/:id", verifyToken, getPayoutByIdController);

/**
 * =====================
 * ADMIN ROUTES
 * =====================
 */

// 4. Admin views all payouts

/** accept a payout */
router.post("/transfer/:payoutId", verifyToken, superAdminOrAdminMiddleware, transferPayout);

// GET /api/payouts
router.get("/all-payouts", verifyToken, superAdminOrAdminMiddleware, getAllPayoutsController);

// 5. Admin views payout details

// GET /api/payouts/:id
router.get("/:id", verifyToken, superAdminOrAdminMiddleware, getPayoutByIdController);

export default router;
