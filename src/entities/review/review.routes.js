import express from "express";
import { approveReview, createReview, declineReview, getAllPendingReviews, getAllReviews, getReviewsCount } from "./review.controller.js";
import { userAdminLenderSuperAdminMiddleware,verifyToken } from "../../core/middlewares/authMiddleware.js";

const router = express.Router();

//user
router.post("/create", verifyToken, userAdminLenderSuperAdminMiddleware, createReview);
router.get("/get-all-reviews", getAllReviews);

//admin
router.get("/get-reviews-count", verifyToken, userAdminLenderSuperAdminMiddleware, getReviewsCount);
router.get("/get-all-pending-reviews", verifyToken, userAdminLenderSuperAdminMiddleware, getAllPendingReviews);
router.patch("/update-approve-review/:id", verifyToken, userAdminLenderSuperAdminMiddleware, approveReview);
router.delete("/delete-decline-review/:id", verifyToken, userAdminLenderSuperAdminMiddleware, declineReview);

export default router;