import listings from "../../../lender/Listings/listings.model.js";
import { cloudinaryUpload } from "../../../../lib/cloudinaryUpload.js";

export const getApprovedDresses = async (page, limit, skip) => {
  const query = { approvalStatus: 'approved' };

  const [data, totalItems] = await Promise.all([
    listings.find(query).skip(skip).limit(limit).lean(),
    listings.countDocuments(query),
  ]);
  if (totalItems === 0) {
    throw new Error('No dresses found with approval status "approved".');
  }

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data,
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

export const toggleDressActiveStatus = async (id, isActive) => {
  const listing = await listings.findById(id);
  if (!listing) throw new Error('Dress not found');

  listing.isActive = isActive;
  await listing.save();

  return listing;
};
