import { generateResponse } from '../../lib/responseFormate.js';

import * as ApplicationService from './application.service.js';

export const newApplication = async (req, res) => {
    try {
        const application = await ApplicationService.createApplication(req.body);
        generateResponse(res, 201, true, 'Application created successfully', application);

    } catch (error) {
        if (error.message === 'An application with this email already exists') {
            generateResponse(res, 400, false, 'An application with this email already exists', null);
        } else {
            generateResponse(res, 500, false, 'Internal server error', null);
        }
    }
}

export const getAllApplications = async (req, res) => {
    try {
        const applications = await ApplicationService.getAllApplications();
        generateResponse(res, 200, true, 'Applications retrieved successfully', applications);
    } catch (error) {
        generateResponse(res, 500, false, 'Internal server error', null);
    }
}
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
