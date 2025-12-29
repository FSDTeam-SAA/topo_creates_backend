import express from "express";
import {
  createHomepageSection,
  getAllHomepageSections,
  getHomepageSectionById,
  updateHomepageSection,
  deleteHomepageSection,
} from "../homepageSections/homepageSections.controller.js";
import { superAdminOrAdminMiddleware, verifyToken } from "../../../../core/middlewares/authMiddleware.js";
import { multerUpload } from "../../../../core/middlewares/multer.js";


const router = express.Router();


router
  .route("/")
  .post(verifyToken, superAdminOrAdminMiddleware, multerUpload([{ name: "filename", maxCount: 10 }]), createHomepageSection)
  .get(getAllHomepageSections);


router
  .route("/:id")
  .get(getHomepageSectionById)
  .put(verifyToken, superAdminOrAdminMiddleware, multerUpload([{ name: "filename", maxCount: 10 }]), updateHomepageSection)
  .delete(verifyToken, superAdminOrAdminMiddleware, deleteHomepageSection);

  
export default router;
