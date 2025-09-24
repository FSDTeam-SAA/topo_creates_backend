import express from "express";
import {
  createTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
  getActiveCounts,
} from "./testimonials.controller.js";
import { adminMiddleware, verifyToken } from "../../../../core/middlewares/authMiddleware.js";


const router = express.Router();


router
  .route("/active-counts")
  .get(getActiveCounts);


router
  .route("/")
  .post(verifyToken, adminMiddleware, createTestimonial)
  .get(getAllTestimonials);


router
  .route("/:id")
  .get(getTestimonialById)
  .put(verifyToken, adminMiddleware, updateTestimonial)
  .delete(verifyToken, adminMiddleware, deleteTestimonial);

 
export default router;
