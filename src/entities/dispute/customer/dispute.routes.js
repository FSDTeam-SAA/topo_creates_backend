import express from 'express';
import { userMiddleware, verifyToken } from '../../../core/middlewares/authMiddleware.js';
import { createDisputeByCustomer, getCustomerDisputeById, getCustomerDisputes } from './dispute.controller.js';
import { multerUpload } from '../../../core/middlewares/multer.js';


const router = express.Router();

router.post('/', multerUpload([{ name: "filename", maxCount: 1 }]), verifyToken, userMiddleware, createDisputeByCustomer);

router.get('/my-disputes', verifyToken, userMiddleware, getCustomerDisputes);

router.get('/my-disputes/:disputeId', verifyToken, userMiddleware, getCustomerDisputeById);


export default router;
