import {
    sendMessageService,
    getMessagesByBookingIdService,
    getAllConversationsService,
} from './message.service.js';
import { generateResponse } from '../../lib/responseFormate.js';
import { Booking } from '../booking/booking.model.js';



export const createMessage = async (req, res) => {
    try {
        const {bookingId, message} = req.body;
        const senderId = req.user._id;
        const messageData = {
            sender: senderId,
            message: message,
        };
        const savedMessage = await sendMessageService(bookingId, messageData);
        if (!savedMessage) {
            return generateResponse(res, 404, false, "Failed to create message");
        }
        generateResponse(res, 201, true, "Message created successfully", savedMessage);
        
    } catch (error) {
        generateResponse(res, 500, false, "Failed to create message", error.message);
        
    }
}


export const getMessagesByBookingId = async (req, res) => {
    try {
      const { bookingId } = req.params;
  
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return generateResponse(res, 404, false, "Booking not found");
      }
  
      const isOwner = booking.customer.toString() === req.user._id.toString();
      const isAdmin = req.user.role === "ADMIN";
      const islender = booking.lender.toString() === req.user._id.toString();
  
      if (!isOwner && !isAdmin && !islender) {
        return generateResponse(res, 403, false, "You are not authorized to view these messages");
      }
  
      const result = await getMessagesByBookingIdService(bookingId,req.user._id);
  
      generateResponse(res, 200, true, "Messages fetched successfully", result);
    } catch (error) {
      generateResponse(res, 500, false, "Failed to fetch messages", error.message);
    }
};
  

export const getAllConversations = async (req, res) => {
  try {
    if(req.user.role !== "ADMIN"){
        return generateResponse(res, 403, false, "You are not authorized to view these conversations");
    }   
    const result = await getAllConversationsService();

    generateResponse(res, 200, true, "Conversations fetched successfully", result);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch conversations", error.message);
  }
};
