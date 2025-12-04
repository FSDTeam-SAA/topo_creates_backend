import express from "express";

import { lenderMiddleware, userAdminLenderMiddleware, userMiddleware, verifyToken } from "../../../core/middlewares/authMiddleware.js";
import { createBookingPaymentController, createSetupIntentController } from "./payment.controller.js";
import { payForSubscription } from "../Subscription/subsPayment.controller.js";




const router = express.Router()

router.post("/create-checkout-session", verifyToken,userMiddleware, createBookingPaymentController);
router.post("/subscription/create-checkout-session/:planId", verifyToken,lenderMiddleware, payForSubscription);
router.post("/savePaymentInfo",verifyToken,userAdminLenderMiddleware,createSetupIntentController);

export default router