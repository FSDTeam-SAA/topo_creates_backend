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
    } = req.query;

    const filters = {
      search,
      size,
      lenderId,
     minPrice: minPrice !== undefined ? parseFloat(minPrice) : undefined,
  maxPrice: maxPrice !== undefined ? parseFloat(maxPrice) : undefined,
      fourDaysSelected: fourDaysSelected === "true",
      eightDaysSelected: eightDaysSelected === "true",
        category
    };

    const {data, pagination } = await listingService.getApprovedDresses(filters,page, limit, skip);
    return res.status(200).json({
      status: true,
      message: 'Approved dresses fetched successfully',
      data,
      pagination,
    });
  } catch (err) {
    generateResponse(res, 500, false, 'Failed to fetch dresses', err.message);
  }
};

export const adminUpdateAnyDress = async (req, res) => {
  const dressId = req.params.id;

  try {
    const updated = await listingService.adminUpdateDress(dressId, req.body, req.files?.media || []);
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