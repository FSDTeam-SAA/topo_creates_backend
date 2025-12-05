import express from "express";
import { approveReview, createReview, declineReview, getAllPendingReviews, getAllReviews, getReviewsCount } from "./review.controller.js";
import {userAdminLenderMiddleware,verifyToken } from "../../core/middlewares/authMiddleware.js";

const router = express.Router();

//user
router.post("/create", verifyToken, userAdminLenderMiddleware, createReview);
router.get("/get-all-reviews", getAllReviews);

//admin
router.get("/get-reviews-count", verifyToken, userAdminLenderMiddleware, getReviewsCount);
router.get("/get-all-pending-reviews", verifyToken, userAdminLenderMiddleware, getAllPendingReviews);
router.patch("/update-approve-review/:id", verifyToken, userAdminLenderMiddleware, approveReview);
router.delete("/delete-decline-review/:id", verifyToken, userAdminLenderMiddleware, declineReview);

export default router;