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

  try {
    const { data, pagination } = await listingService.getApprovedDresses(page, limit, skip);
    return generateResponse(res, 200, true, 'Fetched approved dresses successfully', {
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
    const updated = await listingService.adminUpdateDress(dressId, req.body, req.files?.media || []);
    return generateResponse(res, 200, true, 'Dress updated successfully', {
      id: updated._id,
      dressName: updated.dressName,
      media: updated.media,
     
    });
  } catch (err) {
    generateResponse(res, 400, false, 'Failed to update dress', err.message);
  }
};


export const getApprovalStatsController = async (req, res) => {
  try {
    const updatedDress = await listingService.toggleDressActiveStatus(id, isActive, req.user._id);
    return generateResponse(res, 200, true, 'Dress active status updated successfully', {
      id: updatedDress._id,
      isActive: updatedDress.isActive,

      
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