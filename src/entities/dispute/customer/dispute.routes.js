import express from 'express';
import { userMiddleware, verifyToken } from '../../../core/middlewares/authMiddleware.js';
import { createDisputeByCustomer, getCustomerDisputeById, getCustomerDisputes, replyToSupportByCustomer } from './dispute.controller.js';
import { multerUpload } from '../../../core/middlewares/multer.js';


const router = express.Router();

// Create a new dispute for a booking
router.post('/', multerUpload([{ name: "filename", maxCount: 1 }]), verifyToken, userMiddleware, createDisputeByCustomer);

// Get list of customer's disputes (with filters: status, date range)
router.get('/my-disputes', verifyToken, userMiddleware, getCustomerDisputes);

// Get details of a specific dispute
router.get('/my-disputes/:disputeId', verifyToken, userMiddleware, getCustomerDisputeById);

// Reply to admin in a dispute
router.post('/my-disputes/:disputeId/reply', verifyToken, userMiddleware, replyToSupportByCustomer);

export default router;
