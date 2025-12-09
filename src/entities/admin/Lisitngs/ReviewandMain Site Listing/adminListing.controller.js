import { cloudinaryUpload } from "../../../../lib/cloudinaryUpload.js";
import { generateResponse } from "../../../../lib/responseFormate.js";
import * as listingService from "./adminListing.service.js";

export const getAllApprovedDresses = async (req, res) => {
 

  try {
     const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
const {
      search,
      size,
      lenderId,
     minPrice,
     maxPrice,
      fourDaysSelected,
      eightDaysSelected,
        category,
         latitude, longitude, radius
    } = req.query;

    const filters = {
  search: search?.trim() || undefined,
  size: size === "All" ? undefined : size,
  lenderId: lenderId === "All" ? undefined : lenderId,
  minPrice: minPrice !== undefined && minPrice !== "All" ? parseFloat(minPrice) : undefined,
  maxPrice: maxPrice !== undefined && maxPrice !== "All" ? parseFloat(maxPrice) : undefined,
  fourDaysSelected: fourDaysSelected === "true",
  eightDaysSelected: eightDaysSelected === "true",
  category: category === "All" ? undefined : category,
  latitude: latitude ? parseFloat(latitude) : undefined,
  longitude: longitude ? parseFloat(longitude) : undefined,
  radius: radius ? parseFloat(radius) : 5000,
};

    const {data, pagination , reason } = await listingService.getApprovedDresses(filters,page, limit, skip);
    return res.status(200).json({
      status: true,
      message: 'Approved dresses fetched successfully',
      data,
      pagination,
      reason 
      
    });
  } catch (err) {
    generateResponse(res, 500, false, 'Failed to fetch dresses', err.message);
  }
};

export const adminUpdateAnyDress = async (req, res) => {
  const listingId = req.params.id;

  if (!listingId) {
    return res.status(400).json({ status: false, message: "Listing ID is required" });
  }

  try {
    // This will update listing fields and handle master dress creation/merge if approved
    const { listing, masterDress } = await listingService.adminUpdateDress(listingId, req.body);

    return res.status(200).json({
      status: true,
      message: 'Dress updated successfully',
      data: { listing, masterDress },
    });
  } catch (err) {
    generateResponse(res, 400, false, 'Failed to update dress', err.message);
  }
};


export const getApprovalStatsController = async (req, res) => {
  try {
    const stats = await listingService.getApprovalStats();
    generateResponse(res, 200, true, 'Listings approval stats fetched successfully', stats);
  } catch (error) {
    generateResponse(res, 500, false, 'Failed to fetch approval stats', error.message);
  }
};



export const getDressByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(req.params);
    const result = await listingService.getDressById(id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    return res.json(result);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};


// update master dress
export const adminUpdateMasterDress = async (req, res) => {
  const { masterDressId } = req.params;
  let updateData = { ...req.body };

  if (!masterDressId) {
    return res.status(400).json({ status: false, message: "MasterDress ID is required" });
  }

  try {
    // ✅ Parse JSON fields if sent as strings (common in multipart/form-data)
  // ✅ Safely parse nested JSON fields once
const parseIfJson = (value) => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  return value;
};

// Apply to possible JSON fields
["media", "sizes", "colors", "materials"].forEach((key) => {
  if (updateData[key]) updateData[key] = parseIfJson(updateData[key]);
});


    // === 1️⃣ Upload New Media Files ===
    let uploadedMedia = [];
    if (req.files?.mediaUpload && req.files.mediaUpload.length > 0) {
      for (const file of req.files.mediaUpload) {
        const uploadRes = await cloudinaryUpload(file.path, undefined, "master_dresses/media");
        if (uploadRes?.secure_url) uploadedMedia.push(uploadRes.secure_url);
      }
    }

    // === 2️⃣ Merge Kept + Newly Uploaded Media ===
    const keptMedia = Array.isArray(updateData.media) ? updateData.media : [];
    updateData.media = [...keptMedia, ...uploadedMedia];

    // === 3️⃣ Upload Thumbnail (if provided) ===
    if (req.files?.thumbnail?.[0]) {
      const file = req.files.thumbnail[0];
      const uploadRes = await cloudinaryUpload(file.path, undefined, "master_dresses/thumbnails");
      if (uploadRes?.secure_url) {
        updateData.thumbnail = uploadRes.secure_url;
      }
    }

    // === 4️⃣ Call Service to Update in DB ===
    const updatedDress = await listingService.updateMasterDress(masterDressId, updateData);

    // === ✅ Response ===
    return res.status(200).json({
      status: true,
      message: "Master dress updated successfully",
      data: updatedDress,
    });
  } catch (err) {
    console.error("Update MasterDress error:", err);
    return res.status(500).json({
      status: false,
      message: "Failed to update master dress",
      error: err.message,
    });
  }
};

// get all master dress

export const getMasterDressesController = async (req, res) => {
  try {
    const result = await listingService.getAllMasterDresses(req.query);
    return res.status(200).json({
      status: true,
      message: 'Master dresses fetched successfully',
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    return res.status(500).json({
      status: false,
      message: 'Failed to fetch master dresses',
      error: err.message,
    });
  }
};


//get master dress by id

export const getMasterDressByIdController = async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ status: false, message: 'Master Dress ID is required' });
  }

  try {
    const masterDress = await listingService.getMasterDressById(id);
    return res.status(200).json({
      status: true,
      message: 'Master Dress retrieved successfully',
      data: masterDress,
    });
  } catch (err) {
    return generateResponse(res, 404, false, 'Failed to retrieve Master Dress', err.message);
  }
};


// fetch near lenders

export const getNearestLendersByDressId = async (req, res, next) => {
  try {
    const { dressId } = req.params;
    const { latitude, longitude } = req.query;

   

    const lenders = await listingService.getNearestLendersByDressIdService(dressId, latitude, longitude);

    return res.status(200).json({
      success: true,
      data: lenders,
    });
  } catch (error) {
    next(error);
  }
};