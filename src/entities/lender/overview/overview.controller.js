import { generateResponse } from "../../../lib/responseFormate.js";
import { getLenderOverviewService, getRentalCalendarService } from "./overview.service.js";


export const getLenderOverview = async (req, res) => {
  try {
    const lenderId = req.user._id;
    const { period = "monthly" } = req.query; 

    const data = await getLenderOverviewService(lenderId, period);

    return generateResponse(res, 200, true, "Lender overview fetched", data);
  } catch (err) {
    console.error("Overview Error:", err);
    return generateResponse(res, 500, false, err.message);
  }
};


export const getRentalCalendar = async (req, res) => {
  try {
    let { masterDressId, month, year } = req.query;

    const now = new Date();

    // Default month/year
    if (!month) month = now.toLocaleString("en-US", { month: "long" }); 
    if (!year) year = now.getFullYear();

    const data = await getRentalCalendarService({
      masterDressId,
      month,
      year: Number(year),
    });

    return generateResponse(res, 200, true, "Calendar data fetched", data);

  } catch (error) {
    console.log(error);
    return generateResponse(res, 500, false, "Server error", error.message);
  }
};



