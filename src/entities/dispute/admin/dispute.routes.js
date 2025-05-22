import express from 'express';
import {
  getAllDisputes,
  getDisputeById,
  updateDisputeStatus,
  submitResolution,
  processRefund,
  downloadDisputeReport,
  requestInfoFromParty,
  addAdminNote
} from '../../controllers/admin/disputes.controller.js';
import { adminMiddleware, verifyToken } from '../../../core/middlewares/authMiddleware.js';


const router = express.Router();

// Get all disputes (filters: status, date, search)
router.get('/', verifyToken, adminMiddleware, getAllDisputes);

// Get specific dispute
router.get('/:disputeId', verifyToken, adminMiddleware, getDisputeById);

// Update dispute status
router.patch('/:disputeId/status', verifyToken, adminMiddleware, updateDisputeStatus);

// Submit resolution (mark resolved, decision summary)
router.post('/:disputeId/resolve', verifyToken, adminMiddleware, submitResolution);

// Process refund (or transfer)
router.post('/:disputeId/refund', verifyToken, adminMiddleware, processRefund);

// Download report
router.get('/:disputeId/report', verifyToken, adminMiddleware, downloadDisputeReport);

// Request more info from customer/lender
router.post('/:disputeId/request-info', verifyToken, adminMiddleware, requestInfoFromParty);

// Add internal note (admin-only)
router.post('/:disputeId/note', verifyToken, adminMiddleware, addAdminNote);

export default router;
