import express from "express";
import {
  createHomepageSection,
  getAllHomepageSections,
  getHomepageSectionById,
  updateHomepageSection,
  deleteHomepageSection,
} from "../homepageSections/homepageSections.controller.js";
import { adminMiddleware, verifyToken } from "../../../../core/middlewares/authMiddleware.js";
import { multerUpload } from "../../../../core/middlewares/multer.js";


const router = express.Router();


router
  .route("/")
  .post(verifyToken, adminMiddleware, multerUpload([{ name: "filename", maxCount: 1 }]), createHomepageSection)
  .get(getAllHomepageSections);


router
  .route("/:id")
  .get(getHomepageSectionById)
  .put(verifyToken, adminMiddleware, multerUpload([{ name: "filename", maxCount: 1 }]), updateHomepageSection)
  .delete(verifyToken, adminMiddleware, deleteHomepageSection);

  
export default router;
