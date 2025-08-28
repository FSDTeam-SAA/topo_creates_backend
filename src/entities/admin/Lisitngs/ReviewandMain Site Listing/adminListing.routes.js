import express from 'express';
import { verifyToken, adminMiddleware } from '../../../../core/middlewares/authMiddleware.js';
import {
  getAllApprovedDresses,
  adminUpdateAnyDress,
  getApprovalStatsController,

} from './adminListing.controller.js';

const router = express.Router();

router.get('/', getAllApprovedDresses);

router.patch(
  '/:id',
  verifyToken,
  adminMiddleware,
  adminUpdateAnyDress
);
router.get(
  '/listings/stats',
  verifyToken,
  adminMiddleware,
  getApprovalStatsController
);

export default router;
