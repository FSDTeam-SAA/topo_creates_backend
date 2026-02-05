import express from "express";
import { createNewsletterSubscription, getAllNewsletterSubscription, unsubscribeNewsletter } from "./newsletterSubscription.controller.js";
import { superAdminOrAdminMiddleware, verifyToken } from "../../core/middlewares/authMiddleware.js";

const router = express.Router();

router.post("/create", createNewsletterSubscription);
router.post("/unsubscribe", unsubscribeNewsletter);
router.get("/get-all-newsletter-subscriptions", verifyToken, superAdminOrAdminMiddleware, getAllNewsletterSubscription);

export default router;