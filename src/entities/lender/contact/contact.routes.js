import express from 'express';
import { getAllMessages, submitContactMessage } from './contact.controller.js';
import { adminMiddleware, lenderMiddleware, verifyToken } from '../../../core/middlewares/authMiddleware.js';
import { multerUpload } from '../../../core/middlewares/multer.js';


const router = express.Router();

router.post('/', multerUpload([{ name: "filename", maxCount: 1 }]), verifyToken, lenderMiddleware, submitContactMessage);
router.get('/get-all-message', verifyToken, adminMiddleware, getAllMessages);

export default router;
