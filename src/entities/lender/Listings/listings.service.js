import listings from './listings.model.js';
import { generateDressId } from '../../../lib/generateDressId.js';
import Listing from './listings.model.js';
import { Booking } from '../../booking/booking.model.js';
import mongoose from 'mongoose';

export const createDress = async (data) => {
  const dressId = generateDressId(data.dressName, data.brand);
  if (data.size && !Array.isArray(data.size)) {
    data.size = [data.size];
  }
  const dress = new listings({
    ...data,
    lenderId: data.lenderId,
    dressId: dressId
  });

  return await dress.save();
};

export const getAllDresses = async (page, limit, skip, filters) => {
  const query = {};

  // Apply approvalStatus filter if provided
  if (filters.status && filters.status !== 'All') {
    query.approvalStatus = filters.status;
  }

  if (filters.search) {
    query.dressName = { $regex: filters.search, $options: 'i' }; // Case-insensitive search
  }
  console.log(query);

  const allDresses = await listings

    .find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('lenderId', 'fullName email')
    .lean();

  const totalItems = await listings.countDocuments(query);
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
  return await listings
    .findById(id)
    .populate('lenderId', 'fullName email')
    .lean();
};

export const getDressesByLenderId = async (
  lenderId,
  page,
  limit,
  skip,
  filters
) => {
  // Normalize "All" and empty strings
  const normalizedFilters = {
    search: filters.search?.trim() || undefined,
    size: filters.size === 'All' ? undefined : filters.size,
    condition: filters.condition === 'All' ? undefined : filters.condition,
    status: filters.status === 'All' ? undefined : filters.status,
    pickupOption:
      filters.pickupOption === 'All' ? undefined : filters.pickupOption
  };

  const query = { lenderId };
  const andConditions = [];

  // Search filter
  if (normalizedFilters.search) {
    andConditions.push({
      $or: [
        { dressName: { $regex: normalizedFilters.search, $options: 'i' } },
        { brand: { $regex: normalizedFilters.search, $options: 'i' } },
        { description: { $regex: normalizedFilters.search, $options: 'i' } }
      ]
    });
  }

  // Other filters
  if (normalizedFilters.condition)
    andConditions.push({ condition: normalizedFilters.condition });
  if (normalizedFilters.status)
    andConditions.push({ status: normalizedFilters.status });
  if (normalizedFilters.pickupOption)
    andConditions.push({ pickupOption: normalizedFilters.pickupOption });
  if (normalizedFilters.size)
    andConditions.push({ size: normalizedFilters.size });

  // Apply $and if there are conditions
  if (andConditions.length > 0) {
    query.$and = andConditions;
  }

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
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit
    }
  };
};

export const updateDress = async (id, updateData) => {
  const updatedDress = await listings.findByIdAndUpdate(id, updateData, {
    new: true
  });

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

    isActive: true
  });

  // Popular Listings (most booked)
  const popularAggregation = await Booking.aggregate([
    { $match: { lender: new mongoose.Types.ObjectId(lenderId) } },
    { $unwind: '$listing' }, // if multiple listings per booking
    {
      $group: {
        _id: '$listing',
        bookingsCount: { $sum: 1 }
      }
    },
    { $sort: { bookingsCount: -1 } },
    { $limit: 5 }, // return top 5
    {
      $lookup: {
        from: 'listings', // MongoDB collection name
        localField: '_id',
        foreignField: '_id',
        as: 'listingDetails'
      }
    },
    { $unwind: '$listingDetails' }
  ]);

  const popularListings = popularAggregation.map((p) => ({
    listingId: p._id,
    bookingsCount: p.bookingsCount,
    dressName: p.listingDetails.dressName,
    media: p.listingDetails.media,
    category: p.listingDetails.category,
    status: p.listingDetails.status
  }));

  return {
    totalListings,
    activeListings,
    popularListings
  };
};
