import express from 'express';
import {
  createDisputeByLender,
  getLenderDisputes,
  getLenderDisputeById,
  escalateDisputeByLender,
  replyToSupportByLender
} from './dispute.controller.js';
import { lenderMiddleware, verifyToken } from '../../../core/middlewares/authMiddleware.js';
import { multerUpload } from '../../../core/middlewares/multer.js';


const router = express.Router();

router.post('/', multerUpload([{ name: "filename", maxCount: 1 }]), verifyToken, lenderMiddleware, createDisputeByLender);

router.get('/my-disputes', verifyToken, lenderMiddleware, getLenderDisputes);

router.get('/:disputeId', verifyToken, lenderMiddleware, getLenderDisputeById);

router.post('/:disputeId/escalate', verifyToken, lenderMiddleware, escalateDisputeByLender);

router.post('/:disputeId/reply', verifyToken, lenderMiddleware, replyToSupportByLender);

export default router;
