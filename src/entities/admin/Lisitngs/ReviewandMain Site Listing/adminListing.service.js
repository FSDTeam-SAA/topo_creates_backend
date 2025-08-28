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
    listings.find(query).skip(skip).limit(limit) .populate({ path: 'lenderId', select: 'firstName lastName' }).lean(),
    listings.countDocuments(query),
  ]);
  if (totalItems === 0) {
    throw new Error('No dresses found with approval status "approved".');
  }

    const populatedData = data.map((dress) => ({
    ...dress,
    lenderName: dress.lenderId
      ? `${dress.lenderId.firstName} ${dress.lenderId.lastName}`
      : 'Unknown',
    lenderId: dress.lenderId._id, 
  }));


  const totalPages = Math.ceil(totalItems / limit);

  return {
    data:populatedData,
    pagination: {
      totalPages,
      totalItems,
      itemsPerPage: limit,
    },
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
