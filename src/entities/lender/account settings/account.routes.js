import express from "express";
import { getLenderById, updateLenderById , startDeactivation, sendDeactivationCode, verifyDeactivationCode   } from "./account.controller.js";
import { lenderMiddleware, verifyToken } from "../../../core/middlewares/authMiddleware.js";


const router = express.Router();

router.get("/:id", verifyToken, lenderMiddleware, getLenderById);
router.put("/:id", verifyToken, lenderMiddleware, updateLenderById);

router.post("/deactivate/start", verifyToken, lenderMiddleware, startDeactivation);
router.post("/deactivate/send-code", verifyToken, lenderMiddleware, sendDeactivationCode);
router.post("/deactivate/verify-code", verifyToken, lenderMiddleware, verifyDeactivationCode);


export default router;
