import express from "express";
import {
  getUserChatRooms,
  getAllChatByRoomId,
  getAllChatRoomsAdmin,
  sendMessage,
  getMessagesByRoom,
  editMessage,
  deleteMessage,
  markAsRead,
  updateChatRoomStatus,
  createBookingChatRoomController,
} from "./message.controller.js";
import { verifyToken, superAdminOrAdminMiddleware, userLenderMiddleware } from "../../core/middlewares/authMiddleware.js";
import { multerUpload } from "../../core/middlewares/multer.js";


const router = express.Router();


/* ---------------- CHATROOM ROUTES ---------------- */

router.post(
  "/chatrooms/create-for-booking",
  verifyToken,
  createBookingChatRoomController
);

router.get("/chatrooms", verifyToken, getUserChatRooms);

router.get("/chatrooms/admin/all", verifyToken, superAdminOrAdminMiddleware, getAllChatRoomsAdmin);

router.get("/chatrooms/admin/:roomId", verifyToken, superAdminOrAdminMiddleware, getAllChatByRoomId);

router.put("/chatrooms/admin/:roomId/status", verifyToken, superAdminOrAdminMiddleware, updateChatRoomStatus);


/* ---------------- MESSAGE ROUTES ---------------- */

router.post("/", verifyToken, userLenderMiddleware,  multerUpload([{ name: "attachments", maxCount: 5 }]), sendMessage);

router.get("/:roomId", verifyToken, getMessagesByRoom);

router.put("/:messageId", verifyToken, editMessage);

router.delete("/:messageId", verifyToken, deleteMessage);

router.put("/:roomId/read", verifyToken, markAsRead);


export default router;
