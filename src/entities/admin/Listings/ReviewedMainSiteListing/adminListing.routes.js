import express from 'express';
import { verifyToken, adminMiddleware } from '../../../../core/middlewares/authMiddleware.js';
import { multerUpload } from '../../../../core/middlewares/multer.js';
import {
  getAllApprovedDresses,
  adminUpdateAnyDress,
  toggleActiveStatus
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

router.patch('/:id/active-status', verifyToken, adminMiddleware, toggleActiveStatus);

export default router;
