import { io } from "../../app.js";
import { Booking } from "../booking/booking.model.js";
import { ChatRoom } from "./chatRoom.model.js";
import { Message } from "./message.model.js";


export const sendMessageService = async (bookingId, messageData) => {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  // Check authorization
  if (
    booking.customer.toString() !== messageData.sender.toString() &&
    booking.lender.toString() !== messageData.sender.toString()
  ) {
    // allow admin as well
    throw new Error("You are not authorized to send a message for this booking");
  }

  // Ensure chat room exists
  let chatRoom = await ChatRoom.findOne({ bookingId });
  if (!chatRoom) {
    chatRoom = await ChatRoom.create({
      bookingId,
      participants: [booking.customer, booking.lender],
      createdBy: booking.customer,
    });
  }

  // Save message
  const newMessage = await Message.create({
    chatRoom: chatRoom._id,
    sender: messageData.sender,
    message: messageData.message,
  });

  // Update room metadata
  chatRoom.lastMessage = newMessage.message;
  chatRoom.lastMessageAt = new Date();
  await chatRoom.save();

  // Emit via socket.io
  io.to(`room-${bookingId}`).emit("message", {
    ...newMessage.toObject(),
    bookingId,
  });

  return newMessage;
};


export const getMessagesByBookingIdService = async (bookingId, userId) => {
  const chatRoom = await ChatRoom.findOne({ bookingId });
  if (!chatRoom) throw new Error("ChatRoom not found");

  const messages = await Message.find({ chatRoom: chatRoom._id })
    .populate("sender", "firstName lastName email role")
    .sort({ createdAt: 1 });

  // mark as read
  for (const msg of messages) {
    if (!msg.readBy.includes(userId)) {
      msg.readBy.push(userId);
      await msg.save();
    }
  }

  return { chatRoom, messages };
};


export const getAllConversationsService = async () => {
  const chatRooms = await ChatRoom.find({})
    .populate("participants", "firstName lastName email role")
    .sort({ lastMessageAt: -1 })
    .lean();

  return chatRooms;
};
