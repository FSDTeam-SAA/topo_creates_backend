import { generateResponse } from "../../../../lib/responseFormate.js";
import * as termsService from "./termsAndConditions.service.js";


export const createTerms = async (req, res, next) => {
  try {
    const { name, details, status } = req.body;

    if (!name || !details || !status) {
      return generateResponse(res, 400, false, "Name, details, and status are required");
    }

    const newTerms = await termsService.createTerms({ name, details, status });

    return generateResponse(res, 201, true, "Terms and conditions created successfully", newTerms);
  } catch (error) {
    console.error("Error creating terms and conditions:", error);
    next(error);
  }
};


export const getAllTerms = async (req, res, next) => {
  try {
    const { status } = req.query; 
    const termsList = await termsService.getAllTerms(status);
    return generateResponse(
      res,
      200,
      true,
      "Terms and conditions fetched successfully",
      termsList
    );
  } catch (error) {
    console.error("Error fetching terms and conditions:", error);
    next(error);
  }
};


export const getTermsById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const terms = await termsService.getTermsById(id);

    if (!terms) {
      return generateResponse(res, 404, false, "Terms not found");
    }

    return generateResponse(res, 200, true, "Terms fetched successfully", terms);
  } catch (error) {
    console.error("Error fetching terms by ID:", error);
    next(error);
  }
};


export const updateTerms = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await termsService.updateTerms(id, updateData);

    if (!updated) {
      return generateResponse(res, 404, false, "Terms not found or update failed");
    }

    return generateResponse(res, 200, true, "Terms updated successfully", updated);
  } catch (error) {
    console.error("Error updating terms:", error);
    next(error);
  }
};


export const deleteTerms = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await termsService.deleteTerms(id);

    if (!deleted) {
      return generateResponse(res, 404, false, "Terms not found or already deleted");
    }

    return generateResponse(res, 200, true, "Terms deleted successfully");
  } catch (error) {
    console.error("Error deleting terms:", error);
    next(error);
  }
};
