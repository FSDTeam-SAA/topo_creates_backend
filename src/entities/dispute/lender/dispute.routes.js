import express from 'express';
import {
  createDisputeByLender,
  getLenderDisputes,
  getLenderDisputeById,
  escalateDisputeByLender,
  replyToSupportByLender
} from '../../controllers/lender/disputes.controller.js';
import { lenderMiddleware, verifyToken } from '../../../core/middlewares/authMiddleware.js';


const router = express.Router();

// Create a new dispute for a booking
router.post('/bookings/:bookingId/dispute', verifyToken, lenderMiddleware, createDisputeByLender);

// Get list of lender's disputes (with filters: status, date range)
router.get('/disputes', verifyToken, lenderMiddleware, getLenderDisputes);

// Get details of a specific dispute
router.get('/disputes/:disputeId', verifyToken, lenderMiddleware, getLenderDisputeById);

// Escalate a dispute to admin
router.post('/disputes/:disputeId/escalate', verifyToken, lenderMiddleware, escalateDisputeByLender);

// Reply to admin in a dispute
router.post('/disputes/:disputeId/reply', verifyToken, lenderMiddleware, replyToSupportByLender);

export default router;
