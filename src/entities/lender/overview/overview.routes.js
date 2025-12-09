import express from "express";
import { lenderMiddleware, verifyToken } from "../../../core/middlewares/authMiddleware.js";
import { getLenderOverview, getRentalCalendar } from "./overview.controller.js";


const router = express.Router();

router.get(
  "/",
  verifyToken,
  lenderMiddleware,
  getLenderOverview
);


router.get(
  "/rental-calendar",
  verifyToken,
  getRentalCalendar
);



export default router;

