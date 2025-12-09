import * as disputeService from "./dispute.service.js";
import { generateResponse } from "../../../lib/responseFormate.js";
import { cloudinaryUpload } from "../../../lib/cloudinaryUpload.js";


export const createDisputeByLender = async (req, res, next) => {
  try {
    const lenderId = req.user?._id;
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

    const dispute = await disputeService.createDisputeByLenderService(lenderId, bookingId, disputeData);

    return generateResponse(res, 201, true, "Dispute created successfully", dispute);
  } catch (error) {
    console.error("Error in createDisputeByLender:", error);
    next(error);
  }
};


export const getLenderDisputes = async (req, res, next) => {
  try {
    const lenderId = req.user?._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status, monthFilter } = req.query; 

    const result = await disputeService.getLenderDisputesService(lenderId, page, limit, status, monthFilter);

    return generateResponse(res, 200, true, "Lender disputes fetched successfully", result);
  } catch (error) {
    next(error);
  }
};


export const getLenderDisputeById = async (req, res, next) => {
  try {
    const lenderId = req.user?._id;
    const { disputeId } = req.params;

    if (!disputeId) {
      return generateResponse(res, 400, false, "Dispute ID is required");
    }

    const dispute = await disputeService.getLenderDisputeByIdService(lenderId, disputeId);

    return generateResponse(res, 200, true, "Dispute fetched successfully", dispute);
  } catch (error) {
    console.error("Error in getLenderDisputeById:", error);
    next(error);
  }
};


export const escalateDisputeByLender = async (req, res, next) => {
  try {
    const lenderId = req.user?._id;
    const { disputeId } = req.params;
    const {
      reason,
      description,
      priority,
      confirmed,
      scheduleCall,
      evidence 
    } = req.body;

    if (!disputeId || !reason || !description || !priority || confirmed !== true) {
      return generateResponse(res, 400, false, "All required escalation fields must be provided and confirmed.");
    }

    const result = await disputeService.escalateDisputeByLenderService(
      lenderId,
      disputeId,
      {
        reason,
        description,
        priority,
        confirmed,
        scheduleCall,
        evidence,
      }
    );

    return generateResponse(res, 200, true, "Dispute escalated successfully", result);
  } catch (error) {
    next(error);
  }
};


export const replyToSupportByLender = async (req, res, next) => {
  try {
    const lenderId = req.user?._id;
    const disputeId = req.params.disputeId;
    const { message, attachments = [] } = req.body;

    if (!message) {
      return generateResponse(res, 400, false, "Reply message is required");
    }

    const updatedDispute = await disputeService.replyToSupportByLenderService(
      lenderId,
      disputeId,
      message,
      attachments
    );

    return generateResponse(res, 200, true, "Reply sent to support", updatedDispute);
  } catch (error) {
    next(error);
  }
};
