import express from 'express';
import { verifyToken, adminMiddleware } from '../../../../core/middlewares/authMiddleware.js';
import { multerUpload } from '../../../../core/middlewares/multer.js';
import {
  getAllApprovedDresses,
  adminUpdateAnyDress,
  getApprovalStatsController,

} from './adminListing.controller.js';

const router = express.Router();

router.get('/', verifyToken, adminMiddleware, getAllApprovedDresses);

router.patch(
  '/:id',
  verifyToken,
  adminMiddleware,
  multerUpload([{ name: 'media', maxCount: 5 }]),
  adminUpdateAnyDress
);
router.get(
  '/listings/stats',
  verifyToken,
  adminMiddleware,
  getApprovalStatsController
);

export default router;
