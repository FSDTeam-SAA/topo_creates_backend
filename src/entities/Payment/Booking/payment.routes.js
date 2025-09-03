import express from "express";

import { userMiddleware, verifyToken } from "../../../core/middlewares/authMiddleware.js";
import { createBookingPaymentController } from "./payment.controller.js";



const router = express.Router()

router.post("/create-checkout-session", verifyToken,userMiddleware, createBookingPaymentController);

export default router