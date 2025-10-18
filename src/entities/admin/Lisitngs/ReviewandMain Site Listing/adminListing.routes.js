import express from 'express';
import { verifyToken, adminMiddleware } from '../../../../core/middlewares/authMiddleware.js';
import {
  getAllApprovedDresses,
  adminUpdateAnyDress,
  getApprovalStatsController,
  getDressByIdController,
  adminUpdateMasterDress,
  getMasterDressesController,
  getMasterDressByIdController,

} from './adminListing.controller.js';

const router = express.Router();

router.get('/', getAllApprovedDresses);
router.get('/master-dresses', verifyToken, adminMiddleware, getMasterDressesController);
router.get('/master-dress/:id', verifyToken, adminMiddleware, getMasterDressByIdController);


router.patch(
  '/:id',
  verifyToken,
  adminMiddleware,
  adminUpdateAnyDress
);
router.patch(
  '/master/:masterDressId',
  verifyToken,
  adminMiddleware,
  adminUpdateMasterDress 
);

router.get(
  '/listings/stats',
  verifyToken,
  adminMiddleware,
  getApprovalStatsController
);
router.get('/dress/:id',getDressByIdController)

export default router;
