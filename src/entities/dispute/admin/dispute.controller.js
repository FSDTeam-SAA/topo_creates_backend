import * as disputeService from "./dispute.service.js";
import { generateResponse } from "../../../lib/responseFormate.js";


export const getAllDisputes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { status, monthFilter } = req.query;

    const result = await disputeService.getAllDisputesService(page, limit, status, monthFilter);

    return generateResponse(res, 200, true, "All disputes fetched successfully", result);
  } catch (error) {
    next(error);
  }
};


export const getDisputeById = async (req, res, next) => {
  try {
    const { disputeId } = req.params;

    if (!disputeId) {
      return generateResponse(res, 400, false, "Dispute ID is required");
    }

    const dispute = await disputeService.getDisputeByIdService(disputeId);

    return generateResponse(res, 200, true, "Dispute fetched successfully", dispute);
  } catch (error) {
    console.error("Error in getDisputeById:", error);
    next(error);
  }
};


export const responseToDispute = async (req, res, next) => {
  try {
    const adminId = req.user?._id;
    const { disputeId } = req.params;
    const { message, status } = req.body; 

    if (!message) {
      return generateResponse(res, 400, false, "Message is required");
    }

    const result = await disputeService.respondToDispute(adminId, disputeId, message, status);

    return generateResponse(res, 200, true, "Admin response added successfully", result);
  } catch (error) {
    next(error);
  }
};


export const submitResolution = async (req, res, next) => {
  try {
    const adminId = req.user?._id;
    const { disputeId } = req.params;
    const { message } = req.body;

    if (!message) {
      return generateResponse(res, 400, false, "Resolution message is required");
    }

    const result = await disputeService.resolveDispute(
      adminId,
      disputeId,
      message
    );

    return generateResponse(res, 200, true, "Dispute resolved successfully", result);
  } catch (error) {
    next(error);
  }
};
