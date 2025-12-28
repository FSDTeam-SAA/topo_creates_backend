import express from "express";
import multer from "multer";
import { superAdminOrAdminMiddleware, verifyToken } from "../../../core/middlewares/authMiddleware.js";
import { addSectionImage, deleteSectionImage, getSections, updateSectionImage } from "./edit.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// GET all sections
router.get("/sections",getSections);

// POST: add new image to a section
router.post(
  "/image",
  upload.fields([{ name: "filename", maxCount: 1 }]),
  addSectionImage
);

// PUT: update existing image by index
router.put(
  "/update",

  upload.fields([{ name: "filename", maxCount: 1 }]),
  updateSectionImage
);

router.delete(
  "/delete",

  deleteSectionImage
);


export default router;
