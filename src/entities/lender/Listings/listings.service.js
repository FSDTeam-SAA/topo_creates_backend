import listings from './listings.model.js';
import { cloudinaryUpload } from "../../../lib/cloudinaryUpload.js";
import { generateDressId } from '../../../lib/generateDressId.js';

export const createDress = async (data,files) => {
  const uploadedMedia = [];

  if (files && files.length > 0) {
    for (const file of files) {
      const sanitizedName = data.dressName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[?&=]/g, "");

      const result = await cloudinaryUpload(file.path, sanitizedName, "dresses");

      if (!result?.secure_url) {
        throw new Error("Failed to upload image to Cloudinary");
      }

      uploadedMedia.push(result.secure_url);
    }
  }
  const dressId = generateDressId(data.dressName, data.brand);
  const dress = new listings({
    ...data,
    media: uploadedMedia,
    lenderId: data.lenderId,
    dressId: dressId
  });

  return await dress.save();
};

export const getAllDresses = async (page, limit, skip) => {
  const allDresses = await listings
    .find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('lenderId', 'fullName email')
    .lean();

  const totalItems = await listings.countDocuments();
  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: allDresses,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit
    }
  };
};

export const getDressById = async (id) => {
  return await listings.findById(id).populate('lenderId', 'fullName email').lean();
};

export const getDressesByLender = async (lenderId) => {
  return await listings.find({ lenderId: lenderId }).sort({ createdAt: -1 });
};

export const updateDress = async (id, updateData, files) => {
  const uploadedMedia = [];

  // Upload new images if provided
  if (files && files.length > 0) {
    for (const file of files) {
      const sanitizedTitle = updateData.dressName
        ?.toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[?&=]/g, "") || "dress";

      const result = await cloudinaryUpload(file.path, sanitizedTitle, 'dresses');

      if (!result?.secure_url) {
        throw new Error('Failed to upload image to Cloudinary');
      }

      uploadedMedia.push(result.secure_url);
    }
  }

  // If new media is uploaded, decide whether to replace or append
  if (uploadedMedia.length > 0) {
    updateData.media = uploadedMedia; // this will REPLACE old images
    // OR to append: 
    // const existing = await listings.findById(id);
    // updateData.media = [...existing.media, ...uploadedMedia];
  }

  const updatedDress = await listings.findByIdAndUpdate(id, updateData, { new: true });

  if (!updatedDress) {
    throw new Error('Dress not found');
  }

  return updatedDress;
};

export const deleteDress = async (id) => {
  return await listings.findByIdAndDelete(id);
};
