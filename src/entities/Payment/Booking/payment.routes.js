import express from "express";
import { createBookingPaymentService } from "./payment.service.js";
import { userMiddleware, verifyToken } from "../../../core/middlewares/authMiddleware.js";



const router = express.Router()
router.post("/create-checkout-session", verifyToken,userMiddleware, createBookingPaymentService);

export default router