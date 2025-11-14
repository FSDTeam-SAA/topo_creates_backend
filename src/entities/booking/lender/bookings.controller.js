import { getAllocatedBookingsForLenderService, getUpcomingBookingsForLenderService } from "./booking.service.js";

export const getAllocatedBookingsForLenderController = async (req, res) => {
  try {
    const lenderId = req.user._id; // logged-in lender
    const role = req.user.role;

    if (role !== "LENDER") {
      return res.status(403).json({
        status: false,
        message: "Only lenders can view allocated bookings",
      });
    }

    const result = await getAllocatedBookingsForLenderService(
      lenderId,
      req.query
    );

    return res.status(200).json({
      status: true,
      message: "Allocated bookings fetched successfully",
      data: result,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};


// upcoming bookings controller

export const getUpcomingBookingsForLenderController = async (req, res) => {
  try {
    const lenderId = req.user._id;
    const role = req.user.role;

    if (role !== "LENDER") {
      return res.status(403).json({
        status: false,
        message: "Only lenders can view upcoming bookings"
      });
    }

    const result = await getUpcomingBookingsForLenderService(lenderId, req.query);

    return res.status(200).json({
      status: true,
      message: "Upcoming bookings fetched successfully",
      data: result
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: err.message
    });
  }
};
