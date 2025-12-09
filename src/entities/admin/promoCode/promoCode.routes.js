import express from "express";

import { createPromoCode, deletePromoCode, getAllPromoCodes, getPromoCodeById, getUserSpecificActivePromoCodes, sendPromoCodeEmail, updatePromoCode } from "./promoCode.controller.js";
import { userMiddleware, verifyToken } from "../../../core/middlewares/authMiddleware.js";



const router = express.Router();

router.post("/",  createPromoCode);
router.get("/", getAllPromoCodes);
router.get("/user",verifyToken,userMiddleware,getUserSpecificActivePromoCodes)
router.get("/:id", getPromoCodeById);
router.put("/:id",  updatePromoCode);
router.delete("/:id", deletePromoCode);

// Send email for this promo code
router.post("/:id/send-email", sendPromoCodeEmail);

export default router;
