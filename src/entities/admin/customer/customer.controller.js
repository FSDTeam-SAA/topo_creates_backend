import { generateResponse } from "../../../lib/responseFormate.js";
import { getAllCustomersService, getCustomerByIdService, getCustomerStatsService } from "./customer.service.js";


export const getCustomerStatsController = async (req, res) => {
  try {
    const data = await getCustomerStatsService();
    return generateResponse(res, 200, true, "Customer statistics fetched", data);
  } catch (error) {
    return generateResponse(res, 500, false, error.message);
  }
};


export const getAllCustomersController = async (req, res) => {
  try {
    const data = await getAllCustomersService(req.query);
    return generateResponse(res, 200, true, "Customer list fetched", data);
  } catch (error) {
    return generateResponse(res, 500, false, error.message);
  }
};


export const getCustomerByIdController = async (req, res) => {
  try {
    const customerId = req.params.id;

    const data = await getCustomerByIdService(customerId);

    return generateResponse(res, 200, true, "Customer details fetched", data);
  } catch (error) {
    return generateResponse(res, 500, false, error.message);
  }
};
