import express from "express";

import { lenderMiddleware, userMiddleware, verifyToken } from "../../../core/middlewares/authMiddleware.js";
import { createBookingPaymentController } from "./payment.controller.js";
import { payForSubscription } from "../Subscription/subsPayment.controller.js";



const router = express.Router()

router.post("/create-checkout-session", verifyToken,userMiddleware, createBookingPaymentController);
router.post("/subscription/create-checkout-session", verifyToken,lenderMiddleware, payForSubscription);

export default router