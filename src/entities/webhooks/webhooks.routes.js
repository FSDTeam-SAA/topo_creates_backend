import express from "express";
import { handleStripeWebhook } from "./webhook.controller.js"; // Assumes controller is in the same folder

const router = express.Router();

/**
 * @route   POST /api/webhooks/stripe
 * @desc    Handles incoming webhook events from Stripe (e.g., payment success)
 * @access  Public (but secured by Stripe signature verification in controller)
 */
// Stripe requires the raw body for signature verification.
// Ensure express.json() is not globally applied before this route,
// or use express.raw() specifically for this route.
router.post("/stripe", express.raw({ type: "application/json" }), handleStripeWebhook);

export default router;