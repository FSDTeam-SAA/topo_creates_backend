import User from "../../../auth/auth.model.js";
import { Booking } from "../../../booking/booking.model.js";
import listings from "../../../lender/Listings/listings.model.js";

export const getApprovedDresses = async (filters,page, limit, skip) => {
  const query = { approvalStatus: 'approved' ,isActive: true};
 // Search filter
  if (filters.search) {
    query.$or = [
      { dressName: { $regex: filters.search, $options: "i" } },
      { brand: { $regex: filters.search, $options: "i" } },
      { description: { $regex: filters.search, $options: "i" } },
    ];
  }

 // Size filter
if (filters.size && filters.size !== 'All') {
  query.size = { $in: Array.isArray(filters.size) ? filters.size : [filters.size] };
}

// Category filter
if (filters.category && filters.category !== 'All') {
  query.category = filters.category;
}

// Lender filter
if (filters.lenderId && filters.lenderId !== 'All') {
  query.lenderId = filters.lenderId;
}


// ----------------------
  // GEO / POSTCODE FILTER
  // ----------------------
  if ((filters.latitude && filters.longitude ) || filters.postcode) {
     const searchRadius = filters.radius || 2000;
    let lenderIds = [];
    if (filters.postcode) {
      // Postcode based
      const lenders = await User.find({ role: 'LENDER', postcode: filters.postcode }).select('_id');
      lenderIds = lenders.map(l => l._id);
    } else if (filters.latitude && filters.longitude && filters.radius) {
      // Geo based
      const lenders = await User.find({
        role: 'LENDER',
        location: {
          $nearSphere: {
            $geometry: { type: 'Point', coordinates: [filters.longitude, filters.latitude] },
            $maxDistance: searchRadius, 
          },
        },
      }).select('_id');
      lenderIds = lenders.map(l => l._id);
    }

   // Only apply if lenders found
if (lenderIds.length > 0) {
  query.lenderId = { $in: lenderIds };
} else {
  // No nearby lenders, force zero results
  query.lenderId = { $in: [] };
}
  }




  
   // Unified price filter (applies to both fourDays and eightDays)
// Price filter
if (
  (filters.minPrice !== undefined && filters.minPrice !== 'All') ||
  (filters.maxPrice !== undefined && filters.maxPrice !== 'All')
) {
  query.$or = [
    {
      'rentalPrice.fourDays': {
        ...(filters.minPrice !== undefined && filters.minPrice !== 'All' ? { $gte: filters.minPrice } : {}),
        ...(filters.maxPrice !== undefined && filters.maxPrice !== 'All' ? { $lte: filters.maxPrice } : {}),
      },
    },
    {
      'rentalPrice.eightDays': {
        ...(filters.minPrice !== undefined && filters.minPrice !== 'All' ? { $gte: filters.minPrice } : {}),
        ...(filters.maxPrice !== undefined && filters.maxPrice !== 'All' ? { $lte: filters.maxPrice } : {}),
      },
    },
  ];
}

  const [data, totalItems] = await Promise.all([
    listings.find(query).skip(skip).limit(limit) .populate({ path: 'lenderId', select: 'fullName firstName lastName email longitude latitude' }).lean(),
    listings.countDocuments(query),
  ]);
  // ----------------------
  if (totalItems === 0) {
    let reason = "No dresses found.";

    if (filters.postcode) {
      reason = `No dresses found for postcode "${filters.postcode}".`;
    } else if (filters.latitude && filters.longitude && filters.radius) {
      reason = `No dresses found within ${filters.radius}m of your location.`;
    } else if (filters.category && filters.category !== "All") {
      reason = `No dresses found in category "${filters.category}".`;
    } else if (filters.size && filters.size !== "All") {
      reason = `No dresses available in size "${filters.size}".`;
    } else if (filters.lenderId && filters.lenderId !== "All") {
      reason = `No dresses found for this lender.`;
    } else if (
      (filters.minPrice !== undefined && filters.minPrice !== "All") ||
      (filters.maxPrice !== undefined && filters.maxPrice !== "All")
    ) {
      reason = `No dresses found in the selected price range.`;
    } else if (filters.search) {
      reason = `No dresses matched your search "${filters.search}".`;
    }

    return {
      success: false,
      data: [],
      pagination: { totalPages: 0, totalItems: 0, itemsPerPage: limit },
      message: reason,
    };
  }
    const populatedData = data.map((dress) => ({
    ...dress,
    lenderName: dress.lenderId
      ? `${dress.lenderId.firstName} ${dress.lenderId.lastName}`
      : 'Unknown',
    lenderId: dress.lenderId, 
  }));


  const totalPages = Math.ceil(totalItems / limit);

  // Define reason for consistency
  let reason;
  if (totalItems === 0) {
    if (filters.postcode) reason = `No dresses found for postcode "${filters.postcode}".`;
    else if (filters.latitude && filters.longitude && filters.radius)
      reason = `No dresses found within ${filters.radius}m of your location.`;
    else if (filters.category && filters.category !== "All")
      reason = `No dresses found in category "${filters.category}".`;
    else if (filters.size && filters.size !== "All")
      reason = `No dresses available in size "${filters.size}".`;
    else if (filters.lenderId && filters.lenderId !== "All")
      reason = `No dresses found for this lender.`;
    else if ((filters.minPrice !== undefined && filters.minPrice !== "All") ||
             (filters.maxPrice !== undefined && filters.maxPrice !== "All"))
      reason = `No dresses found in the selected price range.`;
    else if (filters.search)
      reason = `No dresses matched your search "${filters.search}".`;
    else reason = "No dresses found.";
  } else {
    reason = `${totalItems} dresses found.`;
  }

  return {
    data:populatedData,
    pagination: {
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
    reason,
  };
};







export const adminUpdateDress = async (id, updateData) => {
  const listing = await listings.findById(id);
  if (!listing) throw new Error('Dress not found');

  

  const updated = await listings.findByIdAndUpdate(
    id,
    { ...updateData},
    { new: true }
  );

  return updated;
};



export const getApprovalStats = async () => {
  // Total listings
  const totalListings = await listings.countDocuments();

  // Total approved
  const totalApproved = await listings.countDocuments({ approvalStatus: 'approved' });

  // Total pending
  const totalPending = await listings.countDocuments({ approvalStatus: 'pending' });

  return { totalListings, totalApproved, totalPending };
};



export const getDressById = async (dressId) => {
  // 1. Find dress
  const dress = await listings.findById(dressId)
    .populate({ path: "lenderId", select: "firstName lastName email" })
    .lean();

  if (!dress) {
    return { success: false, message: "Dress not found" };
  }

  // 2. Get all bookings for this dress
  const bookings = await Booking.find({ listing: dressId }).lean();

  // 3. Extract booked date ranges
  const bookedRanges = bookings.map((b) => {
    const start = new Date(b.rentalStartDate);
    const end = new Date(b.rentalEndDate);

    let range = [];
    let current = new Date(start);

    while (current <= end) {
      range.push(new Date(current)); // push a copy
      current.setDate(current.getDate() + 1);
    }

    return range;
  });

  // 4. Add booking info into dress response
  return {
    success: true,
    data: {
      ...dress,
      bookings: bookings.map((b) => ({
        rentalStartDate: b.rentalStartDate,
        rentalEndDate: b.rentalEndDate,
        rentalDurationDays: b.rentalDurationDays,
      })),
      bookedDates: bookedRanges, // array of arrays of exact dates
    },
  };
};
