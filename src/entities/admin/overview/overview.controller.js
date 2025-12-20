import { generateResponse } from "../../../lib/responseFormate.js";
import { getAdminDashboardStatsService, getBookingByIdService, getBookingStatsService, getPlatformStatsService, getRevenueTrendsService, topDressesService, topLendersService } from "./overview.service.js";


export const getAdminDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await getAdminDashboardStatsService(startDate, endDate);

    return generateResponse(res, 200, true, "Dashboard stats fetched", stats);
  } catch (err) {
    return generateResponse(res, 500, false, "Server error", err.message);
  }
};


export const getRevenueTrendsController = async (req, res) => {
  try {
    const { year } = req.query;

    const stats = await getRevenueTrendsService(year);

    return generateResponse(res, 200, true, "Revenue trends fetched", stats);
  } catch (error) {
    return generateResponse(res, 500, false, error.message);
  }
};


export const topLendersController = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const data = await topLendersService(Number(page), Number(limit));

    return generateResponse(
      res,
      200,
      true,
      "Top lenders fetched successfully",
      data
    );
  } catch (error) {
    return generateResponse(res, 500, false, error.message);
  }
};


export const topDressesController = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const data = await topDressesService(Number(page), Number(limit));

    return generateResponse(
      res,
      200,
      true,
      "Top dresses fetched successfully",
      data
    );
  } catch (error) {
    return generateResponse(res, 500, false, error.message);
  }
};

/** Booking stats in admin dashboard */


export const getBookingStatsController = async (req, res, next) => {
  try {
    const data = await getBookingStatsService(req.query);

    res.status(200).json({
      success: true,
      message: "Booking stats fetched successfully",
      meta: {
        page: Number(req.query.page) || 1,
        limit: Number(req.query.limit) || 10
      },
      data
    });
  } catch (error) {
    next(error);
  }
};


export const getBookingByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Call service
    const booking = await getBookingByIdService(id);

    // Return success response
    res.status(200).json({
      success: true,
      message: "Booking fetched successfully",
      data: booking
    });
  } catch (error) {
    // Pass error to global error handler
    next(error);
  }
};


export const getPlatformStats = async (req, res, next) => {
  try {
    const stats = await getPlatformStatsService();

    res.status(200).json({
      success: true,
      message: "Platform financial stats fetched successfully",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};