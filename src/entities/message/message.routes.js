import express from "express";
import {
  createMessage,
  getMessagesByBookingId,
  getAllConversations,
} from "./message.controller.js";
import {
  adminMiddleware,
  verifyToken,
} from "../../core/middlewares/authMiddleware.js";


const router = express.Router();


// Send a message (customer, lender, or admin)
router.post("/", verifyToken, createMessage);

// Get all conversations (admin only)
router.get("/all-conversations", verifyToken, adminMiddleware, getAllConversations);

// Get all messages for a booking (customer, lender, or admin)
router.get("/:bookingId", verifyToken, getMessagesByBookingId);

export default router;
