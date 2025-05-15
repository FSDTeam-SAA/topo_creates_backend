import { Types } from "mongoose";
import { Booking } from "../booking/booking.model.js";
import Message from "./message.model.js";
import { io } from "../../app.js";


export const sendMessageService = async (booking,message) => {
    //console.log("Booking ID:", message);
    
    const bookingDoc = await Booking.findById({_id: new Types.ObjectId(booking)});
    if (!bookingDoc) {
        throw new Error("Booking not found");
    }

    //console.log("Booking Document:", bookingDoc);

    if(bookingDoc.customer.toString() !== message.sender.toString() && bookingDoc.lender.toString() !== message.sender.toString()){
        throw new Error("You are not authorized to send a message for this booking");
    }
    let newMessage = await Message.findOne({ bookingId:booking });

    if (!newMessage) {
         newMessage = new Message({
            bookingId: booking,
            messages: []
        });
        await newMessage.save();
    }
    else
    {
        const updateMessage = await Message.findByIdAndUpdate(
            newMessage._id,
            { $push: { messages: message } },
            { new: true, upsert: true }
        );

        // socket.io emit
        io.to(`room-${booking}`).emit("message", {
            message: message,
            sender: message.sender,
            bookingId: booking,
            createdAt: new Date(),
        });
        
        return updateMessage;
    }
};


export const getMessagesByBookingIdService = async (bookingId,userId) => {

    let messages = await Message.findOne({ bookingId: bookingId })
    .populate("messages.sender", "firstName lastName email role")

    let updated = false;
    messages.messages.forEach(msg => {
      if (!msg.read && msg.sender._id.toString() !== userId.toString()) {
        msg.read = true;
        updated = true;
      }
    });

    if (updated) await messages.save();
  
    return {
        messages,
    };
};


export const getAllConversationsService = async () => {
    const messages = await Message.find({})
      .populate("bookingId")
      .populate("messages.sender", "firstName lastName email role")
      .sort({ createdAt: -1 })
      .lean();
      
    return messages;
}