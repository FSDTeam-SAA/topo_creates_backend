import { generateResponse } from '../../lib/responseFormate.js';
import * as ApplicationService from './application.service.js';


export const newApplication = async (req, res) => {
  try {
    const application = await ApplicationService.createApplication(req.body);
    generateResponse(res, 201, true, 'Application created successfully', application);

  } catch (error) {
    if (error.message === 'An application with this email already exists') {
      return generateResponse(res, 400, false, error.message, null);
    }

    if (error.message === 'Business email is required') {
      return generateResponse(res, 400, false, error.message, null);
    }

    generateResponse(res, 500, false, 'Internal server error', null);
  }
};


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

    return generateResponse(res, 200, true, "Data fetched successfully", result);

  } catch (error) {
    console.error("Error fetching applications:", error);

    
    return generateResponse(res, 500, false, "Server error while fetching data", null);
  }
};


export const getApplicationById = async (req, res) => {
    try {
        const application = await ApplicationService.getApplicationById(req.params.id);
        generateResponse(res, 200, true, 'Application retrieved successfully', application);
    } catch (error) {
        if (error.message === 'Application not found') {
            generateResponse(res, 404, false, 'Application not found', null);
        } else {
            generateResponse(res, 500, false, 'Internal server error', null);
        }
    }
}


export const deleteApplication = async (req, res) => {
    try {
        const application = await ApplicationService.deleteApplication(req.params.id);
        generateResponse(res, 200, true, 'Application deleted successfully', application);
    } catch (error) {
        if (error.message === 'Application not found') {
            generateResponse(res, 404, false, 'Application not found', null);
        } else {
            generateResponse(res, 500, false, 'Internal server error', null);
        }
    }
}


export const updateApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const application = await ApplicationService.updateApplication(id, updateData);

        const justApproved =
            updateData.status === 'approved' && application.status === 'approved';

        let user = null;

        if (justApproved) {
            // Create user + send email
            user = await ApplicationService.updateApplication(id, updateData);
        }

        generateResponse(res, 200, true, 'Application updated successfully', {
            application,
            user: user || undefined,
        });
    } catch (error) {
        console.error('Error updating application:', error);
        if (error.message === 'Application not found') {
            generateResponse(res, 404, false, 'Application not found', null);
        } else {
            generateResponse(res, 500, false, 'Internal server error', null);
        }
    }
};
