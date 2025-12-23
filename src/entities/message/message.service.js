import { Message } from "./message.model.js";
import { io } from "../../app.js"; 
import { ChatRoom } from "./chatRoom.model.js";
import { cloudinaryUpload } from "../../lib/cloudinaryUpload.js";
import { Booking } from "../booking/booking.model.js";


export const createBookingChatRoomService = async (bookingId, requesterId) => {
  const booking = await Booking.findById(bookingId)
    .populate("customer", "_id")
    .populate("allocatedLender.lenderId", "_id");

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (!booking.allocatedLender?.lenderId) {
    throw new Error("No lender allocated yet");
  }

  if (!["Paid", "Succeeded", "Pending"].includes(booking.paymentStatus)) {
    throw new Error("Payment not completed");
  }

  const customerId = booking.customer._id;
  const lenderId = booking.allocatedLender.lenderId._id;

  // Authorization
  if (
    requesterId &&
    ![customerId.toString(), lenderId.toString()].includes(requesterId.toString())
  ) {
    throw new Error("Unauthorized access");
  }

  // 1️⃣ Check existing chat
  let chatRoom = await ChatRoom.findOne({ bookingId });

  if (chatRoom) {
    // 🚫 Closed chat cannot be reused
    if (chatRoom.status === "closed") {
      throw new Error("Chat room is closed for this booking");
    }

    return chatRoom;
  }

  // 2️⃣ Create chatroom (defaults respected)
chatRoom = await ChatRoom.create({
    bookingId,
    participants: [customerId, lenderId],
    createdBy: customerId,

    // 👇 FORCE SAME STRUCTURE AS OLD DATA
    lastMessage: "",
    lastMessageAt: null,

    closedAt: null,
    closedBy: null,

    flagged: {
      status: false,
      reason: "",
      flaggedBy: null,
      flaggedAt: null,
    },

    status: "active",
  });

  return chatRoom;
};


export const getUserChatRoomsService = async (userId, page, limit) => {
  const skip = (page - 1) * limit;

  const [rooms, total] = await Promise.all([
    ChatRoom.find({ participants: userId })
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("participants", "firstName lastName email role")
      .populate({
        path: "bookingId",
        populate: {
          path: "masterdressId",  
          model: "MasterDress",
          select: "-__v" 
        }
      })
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
      .populate({
        path: "bookingId",
        populate: {
          path: "masterdressId",  
          model: "MasterDress",
          select: "-__v" 
        }
      })
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

  const senderId = sender.toString();
  const customerId = booking.customer?.toString();
  const lenderId = booking.allocatedLender?.lenderId?.toString();

  if (![customerId, lenderId].includes(senderId)) {
    throw new Error("You are not authorized to send a message in this room");
  }

  if (chatRoom.status === "closed") {
    throw new Error("This conversation has been closed by the admin.");
  }

  // Upload attachments
  let attachments = [];
  for (const file of files) {
    try {
      const upload = await cloudinaryUpload(
        file.path,
        file.filename,
        "chat-attachments"
      );

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

  const newMessage = await Message.create({
    chatRoom: chatRoom._id,
    sender,
    message,
    attachments,
  });

  const newMessagePopulated = await newMessage.populate(
    "sender",
    "firstName lastName profileImage role"
  );

  chatRoom.lastMessage = message || (attachments.length ? "📎 Attachment" : "");
  chatRoom.lastMessageAt = new Date();
  await chatRoom.save();

  io.to(`room-${chatRoom._id}`).emit("message:new", newMessagePopulated);

  return newMessage;
};



export const getMessagesByRoomService = async (roomId, page, limit) => {
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


export const updateChatRoomStatusService = async (roomId, adminId, status, reason = "") => {
  const chatRoom = await ChatRoom.findById(roomId);
  if (!chatRoom) throw new Error("Chat room not found");

  switch (status) {
    case "flagged":
      chatRoom.status = "flagged";
      chatRoom.flagged = {
        status: true,
        reason,
        flaggedBy: adminId,
        flaggedAt: new Date(),
      };
      chatRoom.closedBy = null;
      chatRoom.closedAt = null;
      break;

    case "closed":
      chatRoom.status = "closed";
      chatRoom.closedBy = adminId;
      chatRoom.closedAt = new Date();
      // keep flagged info if previously flagged, or reset if not
      if (!chatRoom.flagged?.status) {
        chatRoom.flagged = {
          status: false,
          reason: "",
          flaggedBy: null,
          flaggedAt: null,
        };
      }
      break;

    case "active":
      chatRoom.status = "active";
      chatRoom.flagged = {
        status: false,
        reason: "",
        flaggedBy: null,
        flaggedAt: null,
      };
      chatRoom.closedBy = null;
      chatRoom.closedAt = null;
      break;

    default:
      throw new Error("Invalid status value");
  }

  await chatRoom.save();

  // Notify clients/admin dashboard in real time
  io.to(`room-${chatRoom._id}`).emit("chatroom:status-updated", {
    roomId: chatRoom._id,
    status: chatRoom.status,
    flagged: chatRoom.flagged,
    closedBy: chatRoom.closedBy,
    closedAt: chatRoom.closedAt,
  });

  return chatRoom;
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
