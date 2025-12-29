import { cloudinaryUpload } from "../../../../lib/cloudinaryUpload.js";
import { generateResponse } from "../../../../lib/responseFormate.js";
import * as homepageSectionService from "../homepageSections/homepageSections.service.js";


export const createHomepageSection = async (req, res, next) => {
  try {
    const { sectionName, content, status } = req.body;

    if (!sectionName || !content || !status) {
      return generateResponse(res, 400, false, "All fields are required");
    }

    let image = [];

    if (req.files?.filename?.length) {
      for (const file of req.files.filename) {
        const uploadResult = await cloudinaryUpload(
          file.path,
          `homepage_section_${Date.now()}`,
          "homepage_sections"
        );

        if (uploadResult?.secure_url) {
          image.push({
            filename: file.originalname,
            url: uploadResult.secure_url,
          });
        }
      }
    }

    const sectionData = {
      sectionName,
      content,
      status,
      image,
    };

    const newSection = await homepageSectionService.createHomepageSection(sectionData);

    return generateResponse(
      res,
      201,
      true,
      "Homepage section created successfully",
      newSection
    );
  } catch (error) {
    console.error("Error creating homepage section:", error);
    next(error);
  }
};



export const getAllHomepageSections = async (req, res, next) => {
  try {
    const { status } = req.query; 
    const sections = await homepageSectionService.getAllHomepageSections(status);
    return generateResponse(
      res,
      200,
      true,
      "Homepage sections fetched successfully",
      sections
    );
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
    const { sectionName, content, status, replaceImages } = req.body;

    const updateData = {};

    if (sectionName) updateData.sectionName = sectionName;
    if (content) updateData.content = content;
    if (status) updateData.status = status;

    // Handle multiple image uploads
    if (req.files?.filename?.length) {
      const uploadedImages = [];

      for (const file of req.files.filename) {
        const uploadResult = await cloudinaryUpload(
          file.path,
          `homepage_section_${Date.now()}`,
          "homepage_sections"
        );

        if (uploadResult?.secure_url) {
          uploadedImages.push({
            filename: file.originalname,
            url: uploadResult.secure_url,
          });
        }
      }

      if (replaceImages === "true") {
        // Replace all existing images
        updateData.image = uploadedImages;
      } else {
        // Append new images to existing ones
        updateData.$push = {
          image: { $each: uploadedImages }
        };
      }
    }

    const updatedSection = await homepageSectionService.updateHomepageSection(
      id,
      updateData
    );

    if (!updatedSection) {
      return generateResponse(res, 404, false, "Homepage section not found");
    }

    return generateResponse(
      res,
      200,
      true,
      "Homepage section updated successfully",
      updatedSection
    );
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
