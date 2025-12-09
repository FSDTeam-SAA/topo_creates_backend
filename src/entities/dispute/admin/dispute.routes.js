import express from 'express';
import { getAllDisputes, getDisputeById, responseToDispute, submitResolution } from './dispute.controller.js';
import { superAdminOrAdminMiddleware, verifyToken } from '../../../core/middlewares/authMiddleware.js';

const router = express.Router();

router.get('/all', verifyToken, superAdminOrAdminMiddleware, getAllDisputes);

router.get('/:disputeId', verifyToken, superAdminOrAdminMiddleware, getDisputeById);

router.post('/:disputeId/response', verifyToken, superAdminOrAdminMiddleware, responseToDispute);

router.post('/:disputeId/resolve', verifyToken, superAdminOrAdminMiddleware, submitResolution);


export default router;
