import * as listingService from './listings.service.js';
import { generateResponse } from '../../../lib/responseFormate.js';

export const listDress = async (req, res) => {
  try {
    const lenderId = req.user._id;
    const dataWithLender = {
      ...req.body,
      lenderId,

    };

    const dress = await listingService.createDress(dataWithLender, req.files?.media || []);


    generateResponse(res, 201, true, "Dress listed successfully", dress);
  } catch (error) {
    generateResponse(res, 400, false, "Failed to list dress", error.message);
  }
};

export const getAllDresses = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const { data, pagination } = await listingService.getAllDresses(page, limit, skip);
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
    const dresses = await listingService.getDressesByLender(req.params.lenderId);
    generateResponse(res, 200, true, "Fetched lender's dresses", dresses);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch lender dresses", error.message);
  }
};

export const updateDress = async (req, res) => {
  try {
    const updated = await listingService.updateDress(req.params.id, req.body, req.files);
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
