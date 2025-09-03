import express from "express";



const router = express.Router()
router.post("/create-checkout-session", protect, createBookingPaymentController);

export default router