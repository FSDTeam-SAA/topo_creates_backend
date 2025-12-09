import TermsAndConditions from "./termsAndConditions.model.js";


export const createTerms = async (data) => {
  const terms = new TermsAndConditions(data);
  return await terms.save();
};


export const getAllTerms = async (status) => {
  const filter = {};
  if (status) {
    filter.status = status; 
  }
  return await TermsAndConditions.find(filter).sort({ createdAt: -1 });
};


export const getTermsById = async (id) => {
  return await TermsAndConditions.findById(id);
};


export const updateTerms = async (id, updateData) => {
  return await TermsAndConditions.findByIdAndUpdate(id, updateData, { new: true });
};


export const deleteTerms = async (id) => {
  return await TermsAndConditions.findByIdAndDelete(id);
};
