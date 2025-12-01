import express from "express";

import { multerUpload } from "../../core/middlewares/multer.js";
import { adminLenderSuperadminMiddleware, adminMiddleware, lenderMiddleware, superAdminOrAdminMiddleware, verifyToken } from "../../core/middlewares/authMiddleware.js";
import { createGeneralContact, createLenderContact, getAllContactsController, getContactByIdController, getContactsStats, updateContactController} from "./support.controller.js";


const router = express.Router();

router.post(
  "/lender",
  verifyToken,lenderMiddleware, // must be logged in
  multerUpload([{ name: "file", maxCount: 1 }]),
  createLenderContact
);

// 🔹 General contact (JSON only)
router.post(
  "/general",
 
  createGeneralContact
);

// Admin only
router.get("/get", verifyToken,superAdminOrAdminMiddleware,
  
 getAllContactsController);
 router.get("/stats", verifyToken, superAdminOrAdminMiddleware, getContactsStats);

// ---------------------- GET CONTACT BY ID ----------------------
router.get("/:id", getContactByIdController);

// ---------------------- UPDATE CONTACT ----------------------
router.patch("/:id",verifyToken, adminLenderSuperadminMiddleware , updateContactController);



export default router;
