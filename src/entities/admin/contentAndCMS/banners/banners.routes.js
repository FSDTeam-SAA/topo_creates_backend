import express from "express";
import {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
} from "./banners.controller.js";
import { superAdminOrAdminMiddleware, verifyToken } from "../../../../core/middlewares/authMiddleware.js";
import { multerUpload } from "../../../../core/middlewares/multer.js";


const router = express.Router();


router
  .route("/")
  .post(verifyToken, superAdminOrAdminMiddleware, multerUpload([{ name: "filename", maxCount: 1 }]), createBanner)
  .get(getAllBanners);


router
  .route("/:id")
  .get(getBannerById)
  .put(verifyToken, superAdminOrAdminMiddleware, multerUpload([{ name: "filename", maxCount: 1 }]), updateBanner)
  .delete(verifyToken, superAdminOrAdminMiddleware, deleteBanner);


export default router;
