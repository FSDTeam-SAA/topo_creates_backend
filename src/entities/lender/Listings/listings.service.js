import listings from './listings.model.js';
import { cloudinaryUpload } from "../../../lib/cloudinaryUpload.js";
import { generateDressId } from '../../../lib/generateDressId.js';
import Listing from './listings.model.js';
import { Booking } from '../../booking/booking.model.js';
import mongoose from 'mongoose';

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

export const getDressesByLenderId = async (lenderId, page, limit, skip, filters) => {
  const query = { lenderId };

  if (filters.search) {
    query.$or = [
      { dressName: { $regex: filters.search, $options: 'i' } },
      { brand: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } }
    ];
  }

  if (filters.condition) query.condition = filters.condition;
  if (filters.status) query.status = filters.status;
  if (filters.pickupOption) query.pickupOption = filters.pickupOption;
  if (filters.size) query.size = filters.size;

  const dresses = await listings
    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('lenderId', 'fullName email')
    .lean();

  const totalItems = await listings.countDocuments(query);
  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: dresses,
    pagination: { currentPage: page, totalPages, totalItems, itemsPerPage: limit }
  };
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


export const getLenderStats = async (lenderId) => {
  // Total Listings
  const totalListings = await Listing.countDocuments({ lenderId });

  // Active Listings
  const activeListings = await Listing.countDocuments({
    lenderId,
    
    isActive: true,
  });

  // Popular Listings (most booked)
  const popularAggregation = await Booking.aggregate([
    { $match: { lender: new mongoose.Types.ObjectId(lenderId) } },
    { $unwind: "$listing" }, // if multiple listings per booking
    {
      $group: {
        _id: "$listing",
        bookingsCount: { $sum: 1 },
      },
    },
    { $sort: { bookingsCount: -1 } },
    { $limit: 5 }, // return top 5
    {
      $lookup: {
        from: "listings", // MongoDB collection name
        localField: "_id",
        foreignField: "_id",
        as: "listingDetails",
      },
    },
    { $unwind: "$listingDetails" },
  ]);

  const popularListings = popularAggregation.map((p) => ({
    listingId: p._id,
    bookingsCount: p.bookingsCount,
    dressName: p.listingDetails.dressName,
    media: p.listingDetails.media,
    category: p.listingDetails.category,
    status: p.listingDetails.status,
  }));

  return {
    totalListings,
    activeListings,
    popularListings,
  };
};