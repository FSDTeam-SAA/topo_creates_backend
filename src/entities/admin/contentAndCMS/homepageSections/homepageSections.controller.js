import { cloudinaryUpload } from "../../../../lib/cloudinaryUpload.js";
import { generateResponse } from "../../../../lib/responseFormate.js";
import * as homepageSectionService from "../homepageSections/homepageSections.service.js";


export const createHomepageSection = async (req, res, next) => {
  try {
    const { sectionName, content } = req.body;

    if (!sectionName || !content) {
      return generateResponse(res, 400, false, "All fields are required");
    }

    let image = [];

    if (req.files?.filename) {
      const file = req.files.filename[0];
      const uploadResult = await cloudinaryUpload(file.path, `homepage_section_${Date.now()}`, "homepage_sections");

      if (uploadResult?.secure_url) {
        image.push({
          filename: file.originalname,
          url: uploadResult.secure_url,
        });
      }
    }

    const sectionData = { sectionName, content, image };

    const newSection = await homepageSectionService.createHomepageSection(sectionData);
    return generateResponse(res, 201, true, "Homepage section created successfully", newSection);
  } catch (error) {
    console.error("Error creating homepage section:", error);
    next(error);
  }
};


export const getAllHomepageSections = async (req, res, next) => {
  try {
    const sections = await homepageSectionService.getAllHomepageSections();
    return generateResponse(res, 200, true, "Homepage sections fetched successfully", sections);
  } catch (error) {
    console.error("Error fetching homepage sections:", error);
    next(error);
  }
};


export const getHomepageSectionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const section = await homepageSectionService.getHomepageSectionById(id);

    if (!section) {
      return generateResponse(res, 404, false, "Homepage section not found");
    }

    return generateResponse(res, 200, true, "Homepage section fetched successfully", section);
  } catch (error) {
    console.error("Error fetching homepage section:", error);
    next(error);
  }
};


export const updateHomepageSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { sectionName, content, status } = req.body;

    let image = [];

    if (req.files?.filename) {
      const file = req.files.filename[0];
      const uploadResult = await cloudinaryUpload(file.path, `homepage_section_${Date.now()}`, "homepage_sections");

      if (uploadResult?.secure_url) {
        image.push({
          filename: file.originalname,
          url: uploadResult.secure_url,
        });
      }
    }

    const updatedData = { sectionName, content, status };
    if (image.length > 0) updatedData.image = image;

    const updatedSection = await homepageSectionService.updateHomepageSection(id, updatedData);

    if (!updatedSection) {
      return generateResponse(res, 404, false, "Homepage section not found or update failed");
    }

    return generateResponse(res, 200, true, "Homepage section updated successfully", updatedSection);
  } catch (error) {
    console.error("Error updating homepage section:", error);
    next(error);
  }
};


export const deleteHomepageSection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await homepageSectionService.deleteHomepageSection(id);

    if (!deleted) {
      return generateResponse(res, 404, false, "Homepage section not found or already deleted");
    }

    return generateResponse(res, 200, true, "Homepage section deleted successfully");
  } catch (error) {
    console.error("Error deleting homepage section:", error);
    next(error);
  }
};
