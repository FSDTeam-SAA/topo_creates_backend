


import { generateResponse } from "../../../lib/responseFormate.js";
import { createBookingPaymentService } from "./payment.service.js";


export const createBookingPaymentController = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const customerId = req.user.id;
    // console.log("req.body:", req.body);
    // console.log("req.user:", req.user);


    const checkoutUrl = await createBookingPaymentService({ bookingId, customerId });

    generateResponse(res, 200, true, "Stripe checkout session created", { checkoutUrl });
  } catch (err) {
    console.error(err);
    generateResponse(res, 400, false, err.message || "Failed to create checkout session");
  }
};
