import express from "express";
import {
  createTerms,
  getAllTerms,
  getTermsById,
  updateTerms,
  deleteTerms,
} from "./termsAndConditions.controller.js";
import { superAdminOrAdminMiddleware, verifyToken } from "../../../../core/middlewares/authMiddleware.js";


const router = express.Router();


router
  .route("/")
  .post(verifyToken, superAdminOrAdminMiddleware, createTerms)
  .get(getAllTerms);


router
  .route("/:id")
  .get(getTermsById)
  .put(verifyToken, superAdminOrAdminMiddleware, updateTerms)
  .delete(verifyToken, superAdminOrAdminMiddleware, deleteTerms);

  
export default router;
