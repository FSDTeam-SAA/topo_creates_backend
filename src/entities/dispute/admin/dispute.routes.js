import express from 'express';
import { getAllDisputes, getDisputeById, responseToDispute, submitResolution } from './dispute.controller.js';
import { adminMiddleware, verifyToken } from '../../../core/middlewares/authMiddleware.js';


const router = express.Router();


router.get('/all', verifyToken, adminMiddleware, getAllDisputes);

router.get('/:disputeId', verifyToken, adminMiddleware, getDisputeById);

router.post('/:disputeId/response', verifyToken, adminMiddleware, responseToDispute);

router.post('/:disputeId/resolve', verifyToken, adminMiddleware, submitResolution);

export default router;
