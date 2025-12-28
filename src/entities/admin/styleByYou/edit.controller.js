import { cloudinaryUpload } from "../../../lib/cloudinaryUpload.js";
import { generateResponse } from "../../../lib/responseFormate.js";
import Section from "./edit.model.js";


// GET all sections
export const getSections = async (req, res, next) => {
  try {
    const sections = await Section.find().sort({ name: 1 });
    return generateResponse(res, 200, true, "Sections fetched", sections);
  } catch (error) {
    next(error);
  }
};

// POST: add an image to a section at a specific index
export const addSectionImage = async (req, res, next) => {
  try {
    const { sectionName, imageIndex } = req.body;

    if (!sectionName || imageIndex === undefined) {
      return generateResponse(
        res,
        400,
        false,
        "sectionName and imageIndex are required"
      );
    }

    // 🔹 Find section or create new
    let section = await Section.findOne({ name: sectionName });

    if (!section) {
      section = new Section({
        name: sectionName,
        images: [],
      });
    }

    // 🔹 Validate image
    if (!req.files?.filename) {
      return generateResponse(res, 400, false, "No image uploaded");
    }

    const file = req.files.filename[0];

    const uploadResult = await cloudinaryUpload(
      file.path,
      `section_${Date.now()}`,
      "sections"
    );

    if (!uploadResult?.secure_url) {
      return generateResponse(res, 500, false, "Failed to upload image");
    }

    // 🔹 Prevent duplicate index (optional but recommended)
    const existingImage = section.images.find(
      (img) => img.index === parseInt(imageIndex)
    );

    if (existingImage) {
      return generateResponse(
        res,
        409,
        false,
        `Image already exists at index ${imageIndex}`
      );
    }

    // 🔹 Add image
    section.images.push({
      filename: file.originalname,
      url: uploadResult.secure_url,
      index: parseInt(imageIndex),
    });

    await section.save();

    return generateResponse(
      res,
      201,
      true,
      "Section image added successfully",
      section
    );
  } catch (error) {
    console.error("Add section image error:", error);
    next(error);
  }
};

// PUT: update an image by sectionName and index
export const updateSectionImage = async (req, res, next) => {
  try {
    const { sectionName, imageIndex } = req.body;

    if (!sectionName || imageIndex === undefined)
      return generateResponse(res, 400, false, "sectionName and imageIndex are required");

    const section = await Section.findOne({ name: sectionName });
    if (!section) return generateResponse(res, 404, false, "Section not found");

    if (!req.files?.filename) return generateResponse(res, 400, false, "No image uploaded");

    const file = req.files.filename[0];
    const uploadResult = await cloudinaryUpload(file.path, `section_${Date.now()}`, "sections");

    if (!uploadResult?.secure_url) return generateResponse(res, 500, false, "Failed to upload image");

    // Replace existing image at index or add new
    const existingImage = section.images.find(img => img.index === parseInt(imageIndex));
    if (existingImage) {
      existingImage.filename = file.originalname;
      existingImage.url = uploadResult.secure_url;
    } else {
      section.images.push({
        filename: file.originalname,
        url: uploadResult.secure_url,
        index: parseInt(imageIndex),
      });
    }

    await section.save();
    return generateResponse(res, 200, true, "Image updated successfully", section);
  } catch (error) {
    next(error);
  }
};


export const deleteSectionImage = async (req, res, next) => {
  try {
    const { sectionName, imageIndex } = req.body;

    if (!sectionName || imageIndex === undefined) {
      return generateResponse(
        res,
        400,
        false,
        "sectionName and imageIndex are required"
      );
    }

    const section = await Section.findOne({ name: sectionName });
    if (!section) {
      return generateResponse(res, 404, false, "Section not found");
    }

    const indexNumber = parseInt(imageIndex);

    const imageExists = section.images.some(
      (img) => img.index === indexNumber
    );

    if (!imageExists) {
      return generateResponse(
        res,
        404,
        false,
        `Image not found at index ${imageIndex}`
      );
    }

    // 🔹 Remove image by index
    section.images = section.images.filter(
      (img) => img.index !== indexNumber
    );

    await section.save();

    return generateResponse(
      res,
      200,
      true,
      `Image at index ${imageIndex} deleted successfully`,
      section
    );
  } catch (error) {
    console.error("Delete section image error:", error);
    next(error);
  }
};

