import { generateResponse } from '../../lib/responseFormate.js';
import * as ApplicationService from './application.service.js';

// CREATE LENDER APPLICATION (updates existing User)
export const newApplication = async (req, res) => {
  try {
    const application = await ApplicationService.createApplication(req.body);
    return generateResponse(res, 201, true, 'Application submitted successfully', application);
  } catch (error) {
    if (
      error.message === 'You have already applied. Please wait for review.' ||
      error.message === 'User with this email is already a lender.' ||
      error.message === 'Email is required'
    ) {
      return generateResponse(res, 400, false, error.message);
    }

    console.error('Error submitting application:', error);
    return generateResponse(res, 500, false, 'Internal server error');
  }
};
// GET ALL APPLICATIONS (Users with applicationStatus)
export const getAllApplications = async (req, res) => {
  try {
    const filters = {
      search: req.query.search,
      status: req.query.status,
      totalbookings: req.query.totalbookings,
      totalRatting: req.query.totalRatting,
      totalListings: req.query.totalListings,
      totalReveneue: req.query.totalReveneue,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    };

    const result = await ApplicationService.getAllApplicationsService(filters);
    return generateResponse(res, 200, true, "Applications fetched successfully", result);

  } catch (error) {
    console.error("Error fetching applications:", error);
    return generateResponse(res, 500, false, "Server error while fetching applications");
  }
};

// GET SINGLE APPLICATION BY USER ID
export const getApplicationById = async (req, res) => {
  try {
    const application = await ApplicationService.getApplicationById(req.params.id);
    return generateResponse(res, 200, true, 'Application retrieved successfully', application);
  } catch (error) {
    if (error.message === 'Application not found') {
      return generateResponse(res, 404, false, error.message);
    }
    return generateResponse(res, 500, false, 'Internal server error');
  }
};

// DELETE APPLICATION FIELDS FROM USER
export const deleteApplication = async (req, res) => {
  try {
    const application = await ApplicationService.deleteApplication(req.params.id);
    return generateResponse(res, 200, true, 'Application deleted successfully', application);
  } catch (error) {
    if (error.message === 'Application not found') {
      return generateResponse(res, 404, false, error.message);
    }
    return generateResponse(res, 500, false, 'Internal server error');
  }
};

// APPROVE/REJECT APPLICATION
export const updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const application = await ApplicationService.updateApplication(id, updateData);

    return generateResponse(res, 200, true, 'Application updated successfully', { application });
  } catch (error) {
    console.error('Error updating application:', error);

    if (error.message === 'Application not found') {
      return generateResponse(res, 404, false, error.message);
    }

    if (error.message.startsWith('This lender application has already been approved')) {
      return generateResponse(res, 400, false, error.message);
    }

    return generateResponse(res, 500, false, 'Internal server error');
  }
};
