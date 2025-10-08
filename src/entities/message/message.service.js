import { Message } from "./message.model.js";
import { io } from "../../app.js"; 
import { ChatRoom } from "./chatRoom.model.js";
import { cloudinaryUpload } from "../../lib/cloudinaryUpload.js";


export const getUserChatRoomsService = async (userId, page, limit) => {
  const skip = (page - 1) * limit;

  // Find chatrooms where user is a participant
  const [rooms, total] = await Promise.all([
    ChatRoom.find({ participants: userId })
      .sort({ lastMessageAt: -1 }) 
      .skip(skip)
      .limit(Number(limit))
      .populate("participants", "firstName lastName email role") 
      .lean(),

    ChatRoom.countDocuments({ participants: userId }),
  ]);

  return {
    data: rooms,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit: Number(limit),
    },
  };
};


export const getAllChatByRoomIdService = async (roomId, page, limit) => {
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ chatRoom: roomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sender", "firstName lastName profileImage role"),
    Message.countDocuments({ chatRoom: roomId }),
  ]);

  return {
    messages,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  };
};


export const getAllChatRoomsAdminService = async (page, limit) => {
  const skip = (page - 1) * limit;

  const [rooms, total] = await Promise.all([
    ChatRoom.find()
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("participants", "firstName lastName email role")
      .lean(),

    ChatRoom.countDocuments(),
  ]);

  return {
    data: rooms,
    pagination: {
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      limit: Number(limit),
    },
  };
};


export const sendMessageService = async (roomId, { sender, message, files }) => {
  const chatRoom = await ChatRoom.findById(roomId).populate("bookingId");
  if (!chatRoom) throw new Error("Chat room not found");

  const booking = chatRoom.bookingId;
  if (!booking) throw new Error("Associated booking not found");

  // Authorization: only participants or admin can send
  if (
    booking.customer.toString() !== sender.toString() &&
    booking.lender.toString() !== sender.toString()
  ) {
    throw new Error("You are not authorized to send a message in this room");
  }

  // Upload attachments
  let attachments = [];
  for (const file of files) {
    try {
      const upload = await cloudinaryUpload(file.path, file.filename, "chat-attachments");
      if (upload?.secure_url) {
        attachments.push({
          url: upload.secure_url,
          type: file.mimetype.startsWith("image")
            ? "image"
            : file.mimetype.startsWith("video")
            ? "video"
            : "file",
          fileName: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
        });
      }
    } catch (err) {
      console.error("Attachment upload failed:", err.message);
    }
  }

  // Save message
  const newMessage = await Message.create({
    chatRoom: chatRoom._id,
    sender,
    message,
    attachments,
  });

  const newMessagePopulated = await newMessage
    .populate("sender", "firstName lastName profileImage role")

  // Update chatRoom metadata
  chatRoom.lastMessage = message || (attachments.length ? "📎 Attachment" : "");
  chatRoom.lastMessageAt = new Date();
  await chatRoom.save();

  // Emit via socket
  io.to(`room-${chatRoom._id}`).emit("message:new", newMessagePopulated);

  return newMessage;
};


export const getMessagesByRoomService = async (roomId, page, limit) => {
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ chatRoom: roomId })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("sender", "firstName lastName profileImage role"),
    Message.countDocuments({ chatRoom: roomId }),
  ]);

  return {
    messages,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
    },
  };
};


export const editMessageService = async (messageId, userId, newText) => {
  const msg = await Message.findById(messageId);
  if (!msg) throw new Error("Message not found");

  if (msg.sender.toString() !== userId.toString()) {
    throw new Error("You are not authorized to edit this message");
  }

  msg.message = newText;
  await msg.save();

  io.to(`room-${msg.chatRoom}`).emit("message:edited", msg);

  return msg;
};


export const deleteMessageService = async (messageId, userId) => {
  const msg = await Message.findById(messageId);
  if (!msg) throw new Error("Message not found");

  if (msg.sender.toString() !== userId.toString()) {
    throw new Error("You are not authorized to delete this message");
  }

  await msg.deleteOne();

  io.to(`room-${msg.chatRoom}`).emit("message:deleted", { messageId });
};


export const markAsReadService = async (roomId, userId) => {
  const updated = await Message.updateMany(
    { chatRoom: roomId, readBy: { $ne: userId } },
    { $addToSet: { readBy: userId } }
  );

  io.to(`room-${roomId}`).emit("message:read", { userId });

  return updated;
};












































































































// import { io } from "../../app.js";
// import { Booking } from "../booking/booking.model.js";
// import { ChatRoom } from "./chatRoom.model.js";
// import { Message } from "./message.model.js";


// export const sendMessageService = async (bookingId, messageData) => {
//   const booking = await Booking.findById(bookingId);
//   if (!booking) throw new Error("Booking not found");

//   // Check authorization
//   if (
//     booking.customer.toString() !== messageData.sender.toString() &&
//     booking.lender.toString() !== messageData.sender.toString()
//   ) {
//     // allow admin as well
//     throw new Error("You are not authorized to send a message for this booking");
//   }

//   // Ensure chat room exists
//   let chatRoom = await ChatRoom.findOne({ bookingId });
//   if (!chatRoom) {
//     chatRoom = await ChatRoom.create({
//       bookingId,
//       participants: [booking.customer, booking.lender],
//       createdBy: booking.customer,
//     });
//   }

//   // Save message
//   const newMessage = await Message.create({
//     chatRoom: chatRoom._id,
//     sender: messageData.sender,
//     message: messageData.message,
//   });

//   // Update room metadata
//   chatRoom.lastMessage = newMessage.message;
//   chatRoom.lastMessageAt = new Date();
//   await chatRoom.save();

//   // Emit via socket.io
//   io.to(`room-${bookingId}`).emit("message", {
//     ...newMessage.toObject(),
//     bookingId,
//   });

//   return newMessage;
// };









// // export const getMessagesByBookingIdService = async (bookingId, userId) => {
// //   const chatRoom = await ChatRoom.findOne({ bookingId });
// //   if (!chatRoom) throw new Error("ChatRoom not found");

// //   const messages = await Message.find({ chatRoom: chatRoom._id })
// //     .populate("sender", "firstName lastName email role")
// //     .sort({ createdAt: 1 });

// //   // mark as read
// //   for (const msg of messages) {
// //     if (!msg.readBy.includes(userId)) {
// //       msg.readBy.push(userId);
// //       await msg.save();
// //     }
// //   }

// //   return { chatRoom, messages };
// // };


// // export const getAllConversationsService = async () => {
// //   const chatRooms = await ChatRoom.find({})
// //     .populate("participants", "firstName lastName email role")
// //     .sort({ lastMessageAt: -1 })
// //     .lean();

// //   return chatRooms;
// // };
