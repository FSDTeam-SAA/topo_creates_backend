import * as disputeService from "./dispute.service.js";
import { generateResponse } from "../../../lib/responseFormate.js";
import { cloudinaryUpload } from "../../../lib/cloudinaryUpload.js";


export const createDisputeByCustomer = async (req, res, next) => {
  try {
    const customerId = req.user?._id;

    const { bookingId, issueType, description } = req.body;

    if (!bookingId || !issueType || !description) {
      return generateResponse(res, 400, false, "Missing required fields");
    }

    let evidence = [];

    if (req.files && req.files.filename) {
      const file = req.files.filename[0];
      const uploadResult = await cloudinaryUpload(
        file.path,
        `dispute_${Date.now()}`,
        "disputes/evidence"
      );

      if (uploadResult?.secure_url) {
        evidence.push({
          filename: file.originalname,
          url: uploadResult.secure_url,
        });
      }
    }

    const disputeData = {
      issueType,
      description,
      evidence,
    };

    const dispute = await disputeService.createDispute(customerId, bookingId, disputeData);

    return generateResponse(res, 201, true, "Dispute created successfully", dispute);
  } catch (error) {
    console.error("Error creating dispute:", error);
    next(error);
  }
};


export const getCustomerDisputes = async (req, res, next) => {
  try {
    const customerId = req.user?._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await disputeService.getCustomerDisputesService(customerId, page, limit);

    return generateResponse(res, 200, true, "Customer disputes fetched", result);
  } catch (error) {
    next(error);
  }
};


export const getCustomerDisputeById = async (req, res, next) => {
  try {
    const customerId = req.user?._id;
    const disputeId = req.params.disputeId;

    const dispute = await disputeService.getCustomerDisputeByIdService(customerId, disputeId);

    if (!dispute) {
      return generateResponse(res, 404, false, "Dispute not found");
    }

    return generateResponse(res, 200, true, "Dispute fetched successfully", dispute);
  } catch (error) {
    next(error);
  }
};


export const updateDisputeByCustomer = async (req, res, next) => {
  try {
    const customerId = req.user?._id;
    const { disputeId } = req.params;
    const { issueType, description } = req.body;

    if (!disputeId) {
      return generateResponse(res, 400, false, "Dispute ID is required");
    }

    let evidence = [];

    // Handle file upload (optional)
    if (req.files && req.files.filename) {
      const file = req.files.filename[0];
      const uploadResult = await cloudinaryUpload(
        file.path,
        `dispute_update_${Date.now()}`,
        "disputes/evidence"
      );

      if (uploadResult?.secure_url) {
        evidence.push({
          filename: file.originalname,
          url: uploadResult.secure_url,
        });
      }
    }

    const updateData = {
      issueType,
      description,
      evidence,
    };

    const updatedDispute = await disputeService.updateDispute(
      customerId,
      disputeId,
      updateData
    );

    return generateResponse(
      res,
      200,
      true,
      "Dispute updated successfully",
      updatedDispute
    );
  } catch (error) {
    console.error("Error updating dispute:", error);
    next(error);
  }
};


export const getDisputeTimeline = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const { disputeId } = req.params;

    const result = await disputeService.getTimelineByCustomer(userId, disputeId);

    return generateResponse(res, 200, true, "Timeline fetched successfully", result);
  } catch (error) {
    next(error);
  }
};
