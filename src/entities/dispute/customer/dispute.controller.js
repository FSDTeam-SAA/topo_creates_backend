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

    // Handle optional file uploads (evidence)
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


