import * as listingService from './listings.service.js';
import { generateResponse } from '../../../lib/responseFormate.js';

export const listDress = async (req, res) => {
  try {
    const lenderId = req.user._id;
    const dataWithLender = {
      ...req.body,
      lenderId,

    };

    const dress = await listingService.createDress(dataWithLender);


    generateResponse(res, 201, true, "Dress listed successfully", dress);
  } catch (error) {
    generateResponse(res, 400, false, "Failed to list dress", error.message);
  }
};

export const getAllDresses = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
   const filters = {
    status: req.query.status === "All" ? undefined : req.query.status,
    search: req.query.search || undefined,  // Add search filter here
  };

  try {
    const { data, pagination } = await listingService.getAllDresses(page, limit, skip,filters);
    return res.status(200).json({
      success: true,
      message: 'Fetched dresses successfully',
      data,
      pagination
    });
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch dresses", error.message);
  }
};

export const getDressById = async (req, res) => {
  try {
    const dress = await listingService.getDressById(req.params.id);
    if (!dress) return generateResponse(res, 404, false, "Dress not found");
    generateResponse(res, 200, true, "Fetched dress successfully", dress);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch dress", error.message);
  }
};

export const getDressesByLender = async (req, res) => {
  try {
    const lenderId = req.params.lenderId || req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filters = {
      search: req.query.search,
      condition: req.query.condition,
      status: req.query.status,
      pickupOption: req.query.pickupOption,
      size: req.query.size
    };

    const { data, pagination } = await listingService.getDressesByLenderId(
      lenderId, page, limit, skip, filters
    );

    generateResponse(res, 200, true, "Fetched lender's dresses", {data, pagination});
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch lender's dresses", error.message);
  }
};


export const updateDress = async (req, res) => {
  try {
    const updated = await listingService.updateDress(req.params.id, req.body);
    if (!updated) return generateResponse(res, 404, false, "Dress not found");
    generateResponse(res, 200, true, "Dress updated successfully", updated);
  } catch (error) {
    generateResponse(res, 400, false, "Failed to update dress", error.message);
  }
};

export const deleteDress = async (req, res) => {
  try {
    const deleted = await listingService.deleteDress(req.params.id);
    if (!deleted) return generateResponse(res, 404, false, "Dress not found");
    generateResponse(res, 200, true, "Dress deleted successfully", deleted);
  } catch (error) {
    generateResponse(res, 400, false, "Failed to delete dress", error.message);
  }
};

export const getLenderStatsController = async (req,res) => {
  try {
    const lenderId = req.user?._id || req.params.lenderId;
    if (!lenderId) {
      return res.status(400).json({ message: "Lender ID is required" });
    }

    const stats = await listingService.getLenderStats(lenderId);
 
    generateResponse(res, 200, true, "Fetched lender stats successfully", stats);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch lender stats", error.message);
  }
};