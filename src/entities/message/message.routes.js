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
} from "./message.controller.js";
import { verifyToken, adminMiddleware } from "../../core/middlewares/authMiddleware.js";
import { multerUpload } from "../../core/middlewares/multer.js";


const router = express.Router();


/* ---------------- CHATROOM ROUTES ---------------- */

router.get("/chatrooms", verifyToken, getUserChatRooms);

router.get("/chatrooms/admin/:roomId", verifyToken, adminMiddleware, getAllChatByRoomId);

router.get("/chatrooms/admin/all", verifyToken, adminMiddleware, getAllChatRoomsAdmin);


/* ---------------- MESSAGE ROUTES ---------------- */

router.post("/", verifyToken, multerUpload([{ name: "attachments", maxCount: 5 }]), sendMessage);

router.get("/:roomId", verifyToken, getMessagesByRoom);

router.put("/:messageId", verifyToken, editMessage);

router.delete("/:messageId", verifyToken, deleteMessage);

router.put("/:roomId/read", verifyToken, markAsRead);


export default router;
