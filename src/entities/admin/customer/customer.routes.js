import express from "express";
import { adminMiddleware, verifyToken } from "../../../core/middlewares/authMiddleware.js";
import { getAllCustomersController, getCustomerByIdController, getCustomerStatsController } from "./customer.controller.js";


const router = express.Router();


router.get("/customer-stats", verifyToken, adminMiddleware, getCustomerStatsController);
router.get("/all-customers", verifyToken, adminMiddleware, getAllCustomersController);

router.get(
  "/:id",
  verifyToken,
  adminMiddleware,
  getCustomerByIdController
);


export default router;
