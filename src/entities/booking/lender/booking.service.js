import { Booking } from "../booking.model.js";

export const getAllocatedBookingsForLenderService = async (lenderId, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const filter = {
    "allocatedLender.lenderId": lenderId
  };

  // Optional filters
  if (query.deliveryStatus) {
    filter.deliveryStatus = query.deliveryStatus;
  }

  if (query.paymentStatus) {
    filter.paymentStatus = query.paymentStatus;
  }

  const [bookings, totalItems] = await Promise.all([
    Booking.find(filter)
      .populate([
        { path: "customer", select: "name email phone" },
        { path: "masterdressId" }, // master dress document
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),

    Booking.countDocuments(filter),
  ]);

  return {
    data: bookings,
    pagination: {
      currentPage: page,
      itemsPerPage: limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
};

// upcoming bookings 

export const getUpcomingBookingsForLenderService = async (lenderId, query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // normalize day start

  const filter = {
    "allocatedLender.lenderId": lenderId,
    rentalStartDate: { $gt: today }
  };

  // Optional: filter by size
  if (query.size) {
    filter.size = query.size;
  }

  // Optional: filter by delivery method
  if (query.deliveryMethod) {
    filter.deliveryMethod = query.deliveryMethod;
  }

  const [bookings, totalItems] = await Promise.all([
    Booking.find(filter)
      .populate([
        { path: "customer", select: "name email phone" },
        { path: "masterdressId" }
      ])
      .sort({ rentalStartDate: 1 })  // closest upcoming first
      .skip(skip)
      .limit(limit)
      .lean(),

    Booking.countDocuments(filter)
  ]);

  return {
    data: bookings,
    pagination: {
      currentPage: page,
      itemsPerPage: limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit)
    }
  };
};
