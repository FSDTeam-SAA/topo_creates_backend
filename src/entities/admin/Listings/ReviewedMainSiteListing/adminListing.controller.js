import { generateResponse } from "../../../../lib/responseFormate.js";
import * as listingService from "./adminListing.service.js";

export const getAllApprovedDresses = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const { data, pagination } = await listingService.getApprovedDresses(page, limit, skip);
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

export const toggleActiveStatus = async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const updatedDress = await listingService.toggleDressActiveStatus(id, isActive, req.user._id);
    return res.status(200).json({
      status: true,
      message: `Dress has been ${isActive ? 'reactivated' : 'deactivated'} successfully`,
      data: updatedDress,
    });
  } catch (error) {
    generateResponse(res, 400, false, 'Failed to update active status', error.message);
  }
};
