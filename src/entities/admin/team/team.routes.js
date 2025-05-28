// routes/admin.routes.js
import express from "express";
import { 
  createAdmin, 
  updateAdminPermissions, 
  getAdminById, 
  getAllAdmins 
} from "./team.controller.js";
import { adminMiddleware, verifyToken } from "../../../core/middlewares/authMiddleware.js";


const router = express.Router();


router.post("/", verifyToken, adminMiddleware, createAdmin);               
router.put("/:id/permissions", verifyToken, adminMiddleware, updateAdminPermissions); 
router.get("/:id", verifyToken, adminMiddleware, getAdminById);              
router.get("/", verifyToken, adminMiddleware, getAllAdmins);                 

export default router;
