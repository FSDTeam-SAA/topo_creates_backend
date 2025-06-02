import express from "express";
import {
  createTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
} from "./testimonials.controller.js";
import { adminMiddleware, verifyToken } from "../../../../core/middlewares/authMiddleware.js";


const router = express.Router();


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
