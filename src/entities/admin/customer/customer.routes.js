import express from "express";
import {  superAdminOrAdminMiddleware, verifyToken } from "../../../core/middlewares/authMiddleware.js";
import { getAllCustomersController, getCustomerByIdController, getCustomerStatsController } from "./customer.controller.js";


const router = express.Router();


router.get("/customer-stats", verifyToken, superAdminOrAdminMiddleware, getCustomerStatsController);
router.get("/all-customers", verifyToken, superAdminOrAdminMiddleware, getAllCustomersController);

router.get(
  "/:id",
  verifyToken,
  superAdminOrAdminMiddleware,
  getCustomerByIdController
);

export default router;
