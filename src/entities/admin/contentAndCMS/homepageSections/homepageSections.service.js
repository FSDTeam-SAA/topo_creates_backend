import HomepageSection from "./homepageSections.model.js";


export const createHomepageSection = async (data) => {
  const section = new HomepageSection(data);
  return await section.save();
};


export const getAllHomepageSections = async (status) => {
  const filter = {};
  if (status) {
    filter.status = status; 
  }
  return await HomepageSection.find(filter).sort({ createdAt: -1 });
};


export const getHomepageSectionById = async (id) => {
  return await HomepageSection.findById(id);
};


export const updateHomepageSection = async (id, data) => {
  return await HomepageSection.findByIdAndUpdate(
    id,
    data,
    { new: true, runValidators: true }
  );
};



export const deleteHomepageSection = async (id) => {
  const result = await HomepageSection.findByIdAndDelete(id);
  return result !== null;
};
