import listings from "../../../lender/Listings/listings.model.js";
import { cloudinaryUpload } from "../../../../lib/cloudinaryUpload.js";

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
  if (filters.size) {
    query.size = { $in: Array.isArray(filters.size) ? filters.size : [filters.size] };
  }
    // Category filter
  if (filters.category) {
    query.category = filters.category;
  }

  // Lender filter
  if (filters.lenderId) {
    query.lenderId = filters.lenderId;
  }

  // Price filters
   // Unified price filter (applies to both fourDays and eightDays)
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query.$or = [
      {
        "rentalPrice.fourDays": {
          ...(filters.minPrice !== undefined ? { $gte: filters.minPrice } : {}),
          ...(filters.maxPrice !== undefined ? { $lte: filters.maxPrice } : {}),
        },
      },
      {
        "rentalPrice.eightDays": {
          ...(filters.minPrice !== undefined ? { $gte: filters.minPrice } : {}),
          ...(filters.maxPrice !== undefined ? { $lte: filters.maxPrice } : {}),
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

export const adminUpdateDress = async (id, updateData, files = []) => {
  const listing = await listings.findById(id);
  if (!listing) throw new Error('Dress not found');

  let uploadedMedia = listing.media;
  if (files.length > 0) {
    uploadedMedia = [];
    for (const file of files) {
      const sanitizedName = updateData.dressName?.toLowerCase().replace(/\s+/g, "-").replace(/[?&=]/g, "");
      const result = await cloudinaryUpload(file.path, sanitizedName, 'dresses');
      if (!result?.secure_url) throw new Error('Failed to upload image');
      uploadedMedia.push(result.secure_url);
    }
  }

  const updated = await listings.findByIdAndUpdate(
    id,
    { ...updateData, media: uploadedMedia },
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
