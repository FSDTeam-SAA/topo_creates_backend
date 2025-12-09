import { generateResponse } from "../../../lib/responseFormate.js";
import { createPayoutRequestService,getAllPayoutsService, getPayoutByIdService, getPayoutsByLenderService } from "./payOut.service.js";


export const createPayoutController = async (req, res) => {
  try {
    const lenderId = req.user?.id; 
    // console.log("lenderr",lenderId);
    const { bookingId } = req.body; 
    if (!bookingId) {
      return generateResponse(res, 400, false, "Booking ID is required");
    }

    const payout = await createPayoutRequestService({lenderId, bookingId});

    generateResponse(res, 201, true, "Payout request created successfully", payout);
  } catch (err) {
    console.error(err);
    generateResponse(res, 400, false, err.message || "Failed to create payout request");
  }
};


/**
 * GET /api/payouts/my
 * Lender: get all payouts
 */
export const getPayoutsByLenderController = async (req, res) => {
  try {
    const lenderId = req.user.id;
    const { page, limit } = req.query;

    const result = await getPayoutsByLenderService(lenderId, { page: Number(page) || 1, limit: Number(limit) || 10 });

    generateResponse(res, 200, true, "Payouts fetched successfully", result);
  } catch (err) {
    console.error(err);
    generateResponse(res, 400, false, err.message || "Failed to fetch payouts");
  }
};

/**
 * GET /api/payouts/my/:id
 * Lender: get payout by ID
 */
export const getPayoutByIdController = async (req, res) => {
  try {
    const payoutId = req.params.id;

    const payout = await getPayoutByIdService(payoutId);

    generateResponse(res, 200, true, "Payout fetched successfully", payout);
  } catch (err) {
    console.error(err);
    generateResponse(res, 400, false, err.message || "Failed to fetch payout");
  }
};

/**
 * GET /api/payouts
 * Admin: get all payouts
 */
export const getAllPayoutsController = async (req, res) => {
  try {
    const { page, limit, status } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const result = await getAllPayoutsService({ page: Number(page) || 1, limit: Number(limit) || 10, filter });

    generateResponse(res, 200, true, "All payouts fetched successfully", result);
  } catch (err) {
    console.error(err);
    generateResponse(res, 400, false, err.message || "Failed to fetch payouts");
  }
};
