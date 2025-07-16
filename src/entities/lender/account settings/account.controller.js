import { generateResponse } from "../../../lib/responseFormate.js";
import {
  getLenderByIdService,
  sendDeactivationCodeService,
  startDeactivationService,
  updateLenderByIdService,
  verifyDeactivationCodeService
} from "./account.service.js";


export const getLenderById = async (req, res) => {
  try {
    const lender = await getLenderByIdService(req.params.id);
    if (!lender) return generateResponse(res, 404, false, "Lender not found");
    generateResponse(res, 200, true, "Lender profile fetched", lender);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to fetch lender profile", error.message);
  }
};


export const updateLenderById = async (req, res) => {
  try {
    const updated = await updateLenderByIdService(req.params.id, req.body);
    if (!updated) return generateResponse(res, 404, false, "Lender not found");
    generateResponse(res, 200, true, "Profile updated", updated);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to update profile", error.message);
  }
};


export const startDeactivation = async (req, res) => {
  try {
    const lenderId = req.user._id;
    const { reason, feedback } = req.body;
    const result = await startDeactivationService({ lenderId, reason, feedback });
    generateResponse(res, 200, true, "Deactivation process initiated", result);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to start deactivation", error.message);
  }
};


export const sendDeactivationCode = async (req, res) => {
  try {
    const result = await sendDeactivationCodeService(req.user._id); 
    generateResponse(res, 200, true, "Verification code sent", result);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to send verification code", error.message);
  }
};


export const verifyDeactivationCode = async (req, res) => {
  try {
    const { code } = req.body;
    const result = await verifyDeactivationCodeService({ userId: req.user._id, code });
    generateResponse(res, 200, true, "Account deactivated", result);
  } catch (error) {
    generateResponse(res, 500, false, "Failed to deactivate account", error.message);
  }
};


