import Banner from "../banners/banners.model.js";
import HomepageSection from "../homepageSections/homepageSections.model.js";
import TermsAndConditions from "../termsAndConditions/termsAndConditions.model.js";
import Testimonial from "./testimonials.model.js";


export const createTestimonial = async (data) => {
  const testimonial = new Testimonial(data);
  return await testimonial.save();
};


export const getAllTestimonials = async (status) => {
  const filter = {};
  if (status) {
    filter.status = status; 
  }
  return await Testimonial.find(filter).sort({ createdAt: -1 });
};


export const getTestimonialById = async (id) => {
  return await Testimonial.findById(id);
};


export const updateTestimonial = async (id, updateData) => {
  return await Testimonial.findByIdAndUpdate(id, updateData, { new: true });
};


export const deleteTestimonial = async (id) => {
  return await Testimonial.findByIdAndDelete(id);
};


export const getActiveCounts = async () => {
  const [bannerCount, homepageCount, termsCount, testimonialCount] =
    await Promise.all([
      Banner.countDocuments({ status: "active" }),
      HomepageSection.countDocuments({ status: "active" }),
      TermsAndConditions.countDocuments({ status: "active" }),
      Testimonial.countDocuments({ status: "active" }),
    ]);

  return {
    banners: bannerCount,
    homepageSections: homepageCount,
    terms: termsCount,
    testimonials: testimonialCount,
  };
};