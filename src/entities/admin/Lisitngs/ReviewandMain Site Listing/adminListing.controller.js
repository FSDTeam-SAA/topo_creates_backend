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
  const dressId = req.params.id;

   if (!dressId) {
      return res.status(400).json({ status: false, message: "Dress ID is required" });
    }

  try {
    const updated = await listingService.adminUpdateDress(dressId, req.body);
    return res.status(200).json({
      status: true,
      message: 'Dress updated successfully',
      data: updated,
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
