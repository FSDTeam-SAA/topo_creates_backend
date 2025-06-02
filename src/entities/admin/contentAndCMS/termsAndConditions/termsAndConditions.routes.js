import express from "express";
import {
  createTerms,
  getAllTerms,
  getTermsById,
  updateTerms,
  deleteTerms,
} from "./termsAndConditions.controller.js";
import { adminMiddleware, verifyToken } from "../../../../core/middlewares/authMiddleware.js";


const router = express.Router();


router
  .route("/")
  .post(verifyToken, adminMiddleware, createTerms)
  .get(getAllTerms);


router
  .route("/:id")
  .get(getTermsById)
  .put(verifyToken, adminMiddleware, updateTerms)
  .delete(verifyToken, adminMiddleware, deleteTerms);


export default router;
