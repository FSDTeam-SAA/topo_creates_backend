import { generateResponse } from "../../../../lib/responseFormate.js";
import * as testimonialService from "./testimonials.service.js";


export const createTestimonial = async (req, res, next) => {
  try {
    const { customerName, content, rating, status } = req.body;

    if (!customerName || !content || !rating || !status) {
      return generateResponse(res, 400, false, "All required fields must be provided.");
    }
  
    const newTestimonial = await testimonialService.createTestimonial({
      customerName,
      content,
      rating,
      status
    });

    return generateResponse(res, 201, true, "Testimonial created successfully", newTestimonial);
  } catch (error) {
    console.error("Error creating testimonial:", error);
    next(error);
  }
};


export const getAllTestimonials = async (req, res, next) => {
  try {
    const { status } = req.query; 
    const testimonials = await testimonialService.getAllTestimonials(status);
    return generateResponse(
      res,
      200,
      true,
      "Testimonials fetched successfully",
      testimonials
    );
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    next(error);
  }
};


export const getTestimonialById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const testimonial = await testimonialService.getTestimonialById(id);

    if (!testimonial) {
      return generateResponse(res, 404, false, "Testimonial not found");
    }

    return generateResponse(res, 200, true, "Testimonial fetched successfully", testimonial);
  } catch (error) {
    console.error("Error fetching testimonial by ID:", error);
    next(error);
  }
};


export const updateTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updated = await testimonialService.updateTestimonial(id, updateData);

    if (!updated) {
      return generateResponse(res, 404, false, "Testimonial not found or could not be updated");
    }

    return generateResponse(res, 200, true, "Testimonial updated successfully", updated);
  } catch (error) {
    console.error("Error updating testimonial:", error);
    next(error);
  }
};


export const deleteTestimonial = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await testimonialService.deleteTestimonial(id);

    if (!deleted) {
      return generateResponse(res, 404, false, "Testimonial not found or already deleted");
    }

    return generateResponse(res, 200, true, "Testimonial deleted successfully");
  } catch (error) {
    console.error("Error deleting testimonial:", error);
    next(error);
  }
};


export const getActiveCounts = async (req, res, next) => {
  try {
    const result = await testimonialService.getActiveCounts();
    return generateResponse(
      res,
      200,
      true,
      "Active counts fetched successfully",
      result
    );
  } catch (error) {
    console.error("Error fetching active counts:", error);
    next(error);
  }
};