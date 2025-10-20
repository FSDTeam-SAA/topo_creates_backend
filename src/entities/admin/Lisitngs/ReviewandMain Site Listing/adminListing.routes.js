import express from 'express';
import { verifyToken, adminMiddleware, userAdminLenderMiddleware } from '../../../../core/middlewares/authMiddleware.js';
import {
  getAllApprovedDresses,
  adminUpdateAnyDress,
  getApprovalStatsController,
  getDressByIdController,
  adminUpdateMasterDress,
  getMasterDressesController,
  getMasterDressByIdController,
  getNearestLendersByDressId,

} from './adminListing.controller.js';

const router = express.Router();

router.get('/', getAllApprovedDresses);
router.get('/master-dresses', getMasterDressesController);
router.get('/master-dress/:id', verifyToken, userAdminLenderMiddleware, getMasterDressByIdController);
router.get('/lenders/nearby/:dressId', getNearestLendersByDressId);

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
