import { generateResponse } from "../../../lib/responseFormate.js";
import {
  createBookingService,
} from "./bookings.service.js";


export const createBooking = async (req, res) => {
  try {
    const customerId = req.user._id; 
    const bookingData = {
      ...req.body,
      customer: customerId,
    };

    const newBooking = await createBookingService(bookingData);

    return generateResponse(res,200,true, 'Booking created successfully', newBooking);
  } catch (error) {
    console.error('Create booking error:', error);
    return generateResponse(res, 500,false, 'Failed to create booking', null);
  }
};
