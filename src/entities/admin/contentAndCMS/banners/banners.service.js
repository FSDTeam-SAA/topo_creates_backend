import Banner from './banners.model.js';


export const createBanner = async (data) => {
  const banner = new Banner(data);
  return await banner.save();
};


export const getAllBanners = async (status) => {
  const filter = {};
  if (status) {
    filter.status = status; 
  }
  return await Banner.find(filter).sort({ createdAt: -1 });
};



export const getBannerById = async (id) => {
  return await Banner.findById(id);
};


export const updateBanner = async (id, data) => {
  return await Banner.findByIdAndUpdate(id, data, { new: true });
};


export const deleteBanner = async (id) => {
  const result = await Banner.findByIdAndDelete(id);
  return result !== null;
};
