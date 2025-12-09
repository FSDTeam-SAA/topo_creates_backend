import express from "express";
import {
  createTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
  getActiveCounts,
} from "./testimonials.controller.js";
import { superAdminOrAdminMiddleware, verifyToken } from "../../../../core/middlewares/authMiddleware.js";


const router = express.Router();


router
  .route("/active-counts")
  .get(getActiveCounts);


router
  .route("/")
  .post(verifyToken, superAdminOrAdminMiddleware, createTestimonial)
  .get(getAllTestimonials);


router
  .route("/:id")
  .get(getTestimonialById)
  .put(verifyToken, superAdminOrAdminMiddleware, updateTestimonial)
  .delete(verifyToken, superAdminOrAdminMiddleware, deleteTestimonial);


export default router;
