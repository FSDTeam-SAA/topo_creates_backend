import express from 'express';
import { getAllDisputes, getDisputeById, initiateRefundController, responseToDispute, submitResolution } from './dispute.controller.js';
import { superAdminOrAdminMiddleware, verifyToken } from '../../../core/middlewares/authMiddleware.js';
import { analyzeDisputeController } from '../aiDecision.js';

const router = express.Router();

router.get('/all', verifyToken, superAdminOrAdminMiddleware, getAllDisputes);

router.get('/:disputeId', verifyToken, superAdminOrAdminMiddleware, getDisputeById);
router.post('/refund',initiateRefundController)
router.post('/:disputeId/response', verifyToken, superAdminOrAdminMiddleware, responseToDispute);

router.post('/:disputeId/resolve', verifyToken, superAdminOrAdminMiddleware, submitResolution);

router.post('/:id',analyzeDisputeController)





export default router;
