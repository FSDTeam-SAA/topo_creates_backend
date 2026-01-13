import mongoose from 'mongoose';
import User from '../../../auth/auth.model.js';
import { Booking } from '../../../booking/booking.model.js';
import listings from '../../../lender/Listings/listings.model.js';
import Listing from '../../../lender/Listings/listings.model.js';
import MasterDress from './masterDressModel.js';

// get dress from listing
export const getApprovedDresses = async (filters, page, limit, skip) => {
  const query = { approvalStatus: 'approved', isActive: true };
  // Search filter
  if (filters.search) {
    query.$or = [
      { dressName: { $regex: filters.search, $options: 'i' } },
      { brand: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } }
    ];
  }

  // Size filter
  if (filters.size && filters.size !== 'All') {
    query.size = {
      $in: Array.isArray(filters.size) ? filters.size : [filters.size]
    };
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
  if ((filters.latitude && filters.longitude) || filters.postcode) {
    const searchRadius = filters.radius || 2000;
    let lenderIds = [];
    if (filters.postcode) {
      // Postcode based
      const lenders = await User.find({
        role: 'LENDER',
        postcode: filters.postcode
      }).select('_id');
      lenderIds = lenders.map((l) => l._id);
    } else if (filters.latitude && filters.longitude && filters.radius) {
      // Geo based
      const lenders = await User.find({
        role: 'LENDER',
        location: {
          $nearSphere: {
            $geometry: {
              type: 'Point',
              coordinates: [filters.longitude, filters.latitude]
            },
            $maxDistance: searchRadius
          }
        }
      }).select('_id');
      lenderIds = lenders.map((l) => l._id);
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
          ...(filters.minPrice !== undefined && filters.minPrice !== 'All'
            ? { $gte: filters.minPrice }
            : {}),
          ...(filters.maxPrice !== undefined && filters.maxPrice !== 'All'
            ? { $lte: filters.maxPrice }
            : {})
        }
      },
      {
        'rentalPrice.eightDays': {
          ...(filters.minPrice !== undefined && filters.minPrice !== 'All'
            ? { $gte: filters.minPrice }
            : {}),
          ...(filters.maxPrice !== undefined && filters.maxPrice !== 'All'
            ? { $lte: filters.maxPrice }
            : {})
        }
      }
    ];
  }

  const [data, totalItems] = await Promise.all([
    listings
      .find(query)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'lenderId',
        select: 'fullName firstName lastName email longitude latitude'
      })
      .lean(),
    listings.countDocuments(query)
  ]);
  // ----------------------
  if (totalItems === 0) {
    let reason = 'No dresses found.';

    if (filters.postcode) {
      reason = `No dresses found for postcode "${filters.postcode}".`;
    } else if (filters.latitude && filters.longitude && filters.radius) {
      reason = `No dresses found within ${filters.radius}m of your location.`;
    } else if (filters.category && filters.category !== 'All') {
      reason = `No dresses found in category "${filters.category}".`;
    } else if (filters.size && filters.size !== 'All') {
      reason = `No dresses available in size "${filters.size}".`;
    } else if (filters.lenderId && filters.lenderId !== 'All') {
      reason = `No dresses found for this lender.`;
    } else if (
      (filters.minPrice !== undefined && filters.minPrice !== 'All') ||
      (filters.maxPrice !== undefined && filters.maxPrice !== 'All')
    ) {
      reason = `No dresses found in the selected price range.`;
    } else if (filters.search) {
      reason = `No dresses matched your search "${filters.search}".`;
    }

    return {
      success: false,
      data: [],
      pagination: { totalPages: 0, totalItems: 0, itemsPerPage: limit },
      message: reason
    };
  }
  const populatedData = data.map((dress) => ({
    ...dress,
    lenderName: dress.lenderId
      ? `${dress.lenderId.firstName} ${dress.lenderId.lastName}`
      : 'Unknown',
    lenderId: dress.lenderId
  }));

  const totalPages = Math.ceil(totalItems / limit);

  // Define reason for consistency
  let reason;
  if (totalItems === 0) {
    if (filters.postcode)
      reason = `No dresses found for postcode "${filters.postcode}".`;
    else if (filters.latitude && filters.longitude && filters.radius)
      reason = `No dresses found within ${filters.radius}m of your location.`;
    else if (filters.category && filters.category !== 'All')
      reason = `No dresses found in category "${filters.category}".`;
    else if (filters.size && filters.size !== 'All')
      reason = `No dresses available in size "${filters.size}".`;
    else if (filters.lenderId && filters.lenderId !== 'All')
      reason = `No dresses found for this lender.`;
    else if (
      (filters.minPrice !== undefined && filters.minPrice !== 'All') ||
      (filters.maxPrice !== undefined && filters.maxPrice !== 'All')
    )
      reason = `No dresses found in the selected price range.`;
    else if (filters.search)
      reason = `No dresses matched your search "${filters.search}".`;
    else reason = 'No dresses found.';
  } else {
    reason = `${totalItems} dresses found.`;
  }

  return {
    data: populatedData,
    pagination: {
      totalPages,
      totalItems,
      itemsPerPage: limit
    },
    reason
  };
};

// updating the approval status and creating master dress to show in the main site
export const adminUpdateDress = async (listingId, adminData = {}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const listing = await Listing.findById(listingId).session(session);
    if (!listing) throw new Error('Listing not found');

    let masterDress = null;

    // 1️⃣ If status is being changed to "approved" and not already approved
    if (
      adminData.approvalStatus === 'approved' &&
      listing.approvalStatus !== 'approved'
    ) {
      listing.approvalStatus = 'approved';
      listing.isActive = true;

      // Check for existing MasterDress
      masterDress = await MasterDress.findOne({
        dressName: listing.dressName
      }).session(session);

      if (!masterDress) {
        // Create new MasterDress
        masterDress = new MasterDress({
          dressName: listing.dressName,
          listingIds: [listing._id.toString()],
          lenderIds: [listing.lenderId],
          sizes: Array.isArray(listing.size) ? listing.size : [listing.size],
          colors: listing.colour ? [listing.colour] : [],
          occasions: listing.occasion || [],
          media: listing.media || [],
          thumbnail: listing.media?.[0] || null,
          pickupOption: listing.pickupOption,
          isActive: true,
          basePrice: adminData.basePrice ?? null,
          insuranceFee: adminData.insuranceFee ?? null,
          rrpPrice: adminData.rrpPrice ?? null,
          shippingDetails: {
            isLocalPickup:
              listing.pickupOption === 'Local' ||
              listing.pickupOption === 'Both',
            isShippingAvailable:
              listing.pickupOption === 'Australia-wide' ||
              listing.pickupOption === 'Both',
            insuranceFee: adminData.insuranceFee ?? null,
            flexibilityNotes: adminData.flexibilityNotes ?? ''
          }
        });
      } else {
        // Merge into existing MasterDress
        masterDress.listingIds = Array.from(
          new Set([...masterDress.listingIds, listing._id.toString()])
        );
        masterDress.lenderIds = Array.from(
          new Set([...masterDress.lenderIds, listing.lenderId])
        );
        masterDress.sizes = Array.from(
          new Set([
            ...masterDress.sizes,
            ...(Array.isArray(listing.size) ? listing.size : [listing.size])
          ])
        );

        if (listing.colour && !masterDress.colors.includes(listing.colour))
          masterDress.colors.push(listing.colour);
        if (listing.occasion && listing.occasion.length)
          masterDress.occasions = Array.from(
            new Set([...masterDress.occasions, ...listing.occasion])
          );
        if (listing.media && listing.media.length)
          masterDress.media = Array.from(
            new Set([...masterDress.media, ...listing.media])
          );

        // Admin fields
        if (adminData.basePrice !== undefined)
          masterDress.basePrice = adminData.basePrice;
        if (adminData.insuranceFee !== undefined)
          masterDress.shippingDetails.insuranceFee = adminData.insuranceFee;
        if (adminData.flexibilityNotes)
          masterDress.shippingDetails.flexibilityNotes =
            adminData.flexibilityNotes;
        if (adminData.thumbnail) masterDress.thumbnail = adminData.thumbnail;
      }

      await masterDress.save({ session });
    }

    // 2️⃣ Update listing fields dynamically
    Object.assign(listing, adminData); // Spread all admin-provided fields
    await listing.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { listing, masterDress };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const getApprovalStats = async () => {
  // Total listings
  const totalListings = await listings.countDocuments();

  // Total approved
  const totalApproved = await listings.countDocuments({
    approvalStatus: 'approved'
  });

  // Total pending
  const totalPending = await listings.countDocuments({
    approvalStatus: 'pending'
  });

  return { totalListings, totalApproved, totalPending };
};

export const getDressById = async (listing) => {
  // 1. Find dress
  const dress = await listings
    .findById(listing)
    .populate({
      path: 'lenderId',
      select: 'firstName fullName lastName  email'
    })
    .lean();

  if (!dress) {
    return { success: false, message: 'Dress not found' };
  }

  // 2. Get all bookings for this dress
  const bookings = await Booking.find({ listing: listing }).lean();

  // 3. Extract booked date ranges
  const bookedRanges = bookings.map((b) => {
    const start = new Date(b.rentalStartDate);
    const end = new Date(b.rentalEndDate);

    let range = [];
    let current = new Date(start);

    while (current <= end) {
      range.push(new Date(current));
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
        rentalDurationDays: b.rentalDurationDays
      })),
      bookedDates: bookedRanges
    }
  };
};

// update master dress fields

export const updateMasterDress = async (masterDressId, updateData = {}) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const masterDress = await MasterDress.findOne({ masterDressId }).session(session);
    if (!masterDress) throw new Error("MasterDress not found");

    // ✅ Merge new fields
    Object.assign(masterDress, updateData);

    // ✅ Ensure thumbnail exists
    if (!masterDress.thumbnail && masterDress.media?.length > 0) {
      masterDress.thumbnail = masterDress.media[0];
    }

    await masterDress.save({ session });
    await session.commitTransaction();
    session.endSession();

    return masterDress;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};



// get all master dress

export const getAllMasterDresses = async (query) => {
  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10; // default 10
  const skip = (page - 1) * limit;

  // Only active master dresses
  const filter = { isActive: true };

  // Optional search filter
  if (query.search) {
    filter.$or = [
      { dressName: { $regex: query.search, $options: 'i' } },
      { slug: { $regex: query.search, $options: 'i' } }
    ];
  }

   // Price range filtering (basePrice is ROOT level)
  if (query.minPrice || query.maxPrice) {
    filter.basePrice = {};

    if (query.minPrice) {
      filter.basePrice.$gte = Number(query.minPrice);
    }
    if (query.maxPrice) {
      filter.basePrice.$lte = Number(query.maxPrice);
    }
  }

  // Size filter (sizes = string array)
  if (query.size) {
    filter.sizes = { $in: [query.size] };
  }


   // 🏠 Local pickup filter (independent)
  if (query.localPickup !== undefined) {
    filter['shippingDetails.isLocalPickup'] =
      query.localPickup === 'true';
  }

  // 🚚 Shipping filter (independent)
  if (query.shipping !== undefined) {
    filter['shippingDetails.isShippingAvailable'] =
      query.shipping === 'true';
  }

  const [data, totalItems] = await Promise.all([
    MasterDress.find(filter).skip(skip).limit(limit).lean(),
    MasterDress.countDocuments(filter)
  ]);

  // const totalItems = await MasterDress.countDocuments(filter);
  const totalPages = Math.ceil(totalItems / limit);

  return {
    data,
    pagination: {
      currentPage: page,
      itemsPerPage: limit,
      totalItems,
      totalPages,
    },
  };
};

// get master dress by id

export const getMasterDressById = async (id) => {
  // Try finding by _id first
  let masterDress = await MasterDress.findById(id).lean();

  // If not found, try masterDressId
  if (!masterDress) {
    masterDress = await MasterDress.findOne({ masterDressId: id }).lean();
  }

  if (!masterDress) {
    throw new Error('Master Dress not found');
  }

  return masterDress;
};

export const getNearestLendersByDressIdService = async (
  dressId,
  userLatitude,
  userLongitude,
  radius = 10000
) => {
  if (!mongoose.Types.ObjectId.isValid(dressId)) {
    throw new Error('Invalid dress ID');
  }

  // Fetch dress document
  const dress = await MasterDress.findById(dressId).select('lenderIds');
  if (!dress || !dress.lenderIds || dress.lenderIds.length === 0) {
    throw new Error('No lenders associated with this dress');
  }

  // Find lenders within radius and sort by distance
  const nearestLenders = await User.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [parseFloat(userLongitude), parseFloat(userLatitude)]
        },
        distanceField: 'distance',
        maxDistance: radius, // in meters
        spherical: true,
        query: {
          _id: { $in: dress.lenderIds },
          role: 'LENDER'
        }
      }
    },
    {
      $sort: { distance: 1 } // Nearest first
    },
    {
      $project: {
        _id: 1,
        name: 1,
        email: 1,
        distance: 1,
        location: 1
      }
    }
  ]);

  return nearestLenders;
};
