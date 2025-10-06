import {
  sendMessageService,
  getMessagesByRoomService,
  editMessageService,
  deleteMessageService,
  markAsReadService,
  getUserChatRoomsService,
  getAllChatRoomsAdminService,
  getAllChatByRoomIdService,
} from "./message.service.js";
import { generateResponse } from "../../lib/responseFormate.js";


export const getUserChatRooms = async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const result = await getUserChatRoomsService(userId, page, limit);

    generateResponse(res, 200, true, "Chat rooms fetched successfully", result);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch chat rooms", error.message);
  }
};


export const getAllChatByRoomId = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const { messages, pagination } = await getAllChatByRoomIdService(roomId, page, limit);

    generateResponse(res, 200, true, "Messages fetched successfully", {
      messages,
      pagination,
    });
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch messages", error.message);
  }
};


export const getAllChatRoomsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const result = await getAllChatRoomsAdminService(page, limit);

    generateResponse(res, 200, true, "All chat rooms fetched successfully", result);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch all chat rooms", error.message);
  }
};


export const sendMessage = async (req, res) => {
  try {
    const { roomId, message } = req.body;
    const senderId = req.user._id;

    if (!roomId) {
      return generateResponse(res, 400, false, "roomId is required");
    }

    if (!message && !req.files?.attachments?.length) {
      return generateResponse(res, 400, false, "Message or attachment is required");
    }

    const files = req.files?.attachments || [];

    const savedMessage = await sendMessageService(roomId, {
      sender: senderId,
      message,
      files,
    });

    generateResponse(res, 201, true, "Message created successfully", savedMessage);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to create message", error.message);
  }
};


export const getMessagesByRoom = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const { messages, pagination } = await getMessagesByRoomService(roomId, page, limit);

    generateResponse(res, 200, true, "Messages fetched successfully", {
      messages,
      pagination,
    });
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch messages", error.message);
  }
};


export const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;
    const userId = req.user._id;

    const updatedMessage = await editMessageService(messageId, userId, message);

    generateResponse(res, 200, true, "Message updated successfully", updatedMessage);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to update message", error.message);
  }
};


export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    await deleteMessageService(messageId, userId);

    generateResponse(res, 200, true, "Message deleted successfully");
  } catch (error) {
    generateResponse(res, 500, false, "Failed to delete message", error.message);
  }
};


export const markAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id;

    const updated = await markAsReadService(roomId, userId);

    generateResponse(res, 200, true, "Messages marked as read", updated);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to mark messages as read", error.message);
  }
};
