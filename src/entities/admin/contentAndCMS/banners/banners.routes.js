import express from "express";
import {
  createBanner,
  getAllBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
} from "./banners.controller.js";
import { adminMiddleware, verifyToken } from "../../../../core/middlewares/authMiddleware.js";
import { multerUpload } from "../../../../core/middlewares/multer.js";


const router = express.Router();


router
  .route("/")
  .post(verifyToken, adminMiddleware, multerUpload([{ name: "filename", maxCount: 1 }]), createBanner)
  .get(getAllBanners);


router
  .route("/:id")
  .get(getBannerById)
  .put(verifyToken, adminMiddleware, multerUpload([{ name: "filename", maxCount: 1 }]), updateBanner)
  .delete(verifyToken, adminMiddleware, deleteBanner);

  
export default router;
