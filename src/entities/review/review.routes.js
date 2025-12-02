import express from "express";
import { approveReview, createReview, declineReview, getAllPendingReviews, getAllReviews, getReviewsCount } from "./review.controller.js";
import { adminMiddleware, userMiddleware, verifyToken } from "../../core/middlewares/authMiddleware.js";

const router = express.Router();

//user
router.post("/create", verifyToken, userMiddleware, createReview);
router.get("/get-all-reviews", getAllReviews);

//admin
router.get("/get-reviews-count", verifyToken, adminMiddleware, getReviewsCount);
router.get("/get-all-pending-reviews", verifyToken, adminMiddleware, getAllPendingReviews);
router.patch("/update-approve-review/:id", verifyToken, adminMiddleware, approveReview);
router.delete("/delete-decline-review/:id", verifyToken, adminMiddleware, declineReview);

export default router;