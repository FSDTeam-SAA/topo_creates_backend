import express from "express";
import {
  getMessagesByBookingId,
  getAllConversations,
  createMessage
} from "./message.controller.js";
import { adminMiddleware, verifyToken } from "../../core/middlewares/authMiddleware.js";


const router = express.Router();

// Send a message (admin or seller)
router.post("/", verifyToken, createMessage);

// Get full message thread for a resource (admin or seller)
router.get("/:bookingId", verifyToken, getMessagesByBookingId);

// Get all conversations 
router.get("/all-conversations", verifyToken, adminMiddleware, getAllConversations);

export default router;
