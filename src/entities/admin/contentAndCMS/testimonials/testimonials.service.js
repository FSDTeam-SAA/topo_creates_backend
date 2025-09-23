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
