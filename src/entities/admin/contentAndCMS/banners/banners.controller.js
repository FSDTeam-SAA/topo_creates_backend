import { cloudinaryUpload } from '../../../../lib/cloudinaryUpload.js';
import { generateResponse } from '../../../../lib/responseFormate.js';
import * as bannerService from './banners.service.js';


export const createBanner = async (req, res, next) => {
  try {
    const { title, status } = req.body;

    if (!title || !status) {
      return generateResponse(res, 400, false, 'Title and status are required');
    }

    let image = [];

    if (req.files?.filename) {
      const file = req.files.filename[0];
      const uploadResult = await cloudinaryUpload(file.path, `banner_${Date.now()}`, 'banners');

      if (uploadResult?.secure_url) {
        image.push({
          filename: file.originalname,
          url: uploadResult.secure_url,
        });
      }
    }

    const bannerData = { title, status, image };

    const newBanner = await bannerService.createBanner(bannerData);
    return generateResponse(res, 201, true, 'Banner created successfully', newBanner);
  } catch (error) {
    console.error('Error creating banner:', error);
    next(error);
  }
};


export const getAllBanners = async (req, res, next) => {
  try {
    const { status } = req.query; 
    const banners = await bannerService.getAllBanners(status);
    return generateResponse(res, 200, true, 'Banners fetched successfully', banners);
  } catch (error) {
    console.error('Error fetching banners:', error);
    next(error);
  }
};


export const getBannerById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await bannerService.getBannerById(id);

    if (!banner) {
      return generateResponse(res, 404, false, 'Banner not found');
    }

    return generateResponse(res, 200, true, 'Banner fetched successfully', banner);
  } catch (error) {
    console.error('Error fetching banner:', error);
    next(error);
  }
};


export const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, status } = req.body;

    let image = [];

    if (req.files?.filename) {
      const file = req.files.filename[0];
      const uploadResult = await cloudinaryUpload(file.path, `banner_${Date.now()}`, 'banners');

      if (uploadResult?.secure_url) {
        image.push({
          filename: file.originalname,
          url: uploadResult.secure_url,
        });
      }
    }

    const updatedData = { title, status };
    if (image.length > 0) updatedData.image = image;

    const updatedBanner = await bannerService.updateBanner(id, updatedData);

    if (!updatedBanner) {
      return generateResponse(res, 404, false, 'Banner not found or update failed');
    }

    return generateResponse(res, 200, true, 'Banner updated successfully', updatedBanner);
  } catch (error) {
    console.error('Error updating banner:', error);
    next(error);
  }
};


export const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await bannerService.deleteBanner(id);

    if (!deleted) {
      return generateResponse(res, 404, false, 'Banner not found or already deleted');
    }

    return generateResponse(res, 200, true, 'Banner deleted successfully');
  } catch (error) {
    console.error('Error deleting banner:', error);
    next(error);
  }
};
