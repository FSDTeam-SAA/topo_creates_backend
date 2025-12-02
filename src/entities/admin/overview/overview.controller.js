import { generateResponse } from "../../../lib/responseFormate.js";
import { getAdminDashboardStatsService, getRevenueTrendsService } from "./overview.service.js";


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

