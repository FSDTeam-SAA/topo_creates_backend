import express from 'express';
import { verifyToken, superAdminOrAdminMiddleware } from '../../../../core/middlewares/authMiddleware.js';
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
import { multerUpload } from '../../../../core/middlewares/multer.js';

const router = express.Router();

router.get('/', getAllApprovedDresses);
router.get('/master-dresses', getMasterDressesController);
router.get('/master-dress/:id',getMasterDressByIdController);
router.get('/lenders/nearby/:dressId', getNearestLendersByDressId);

router.patch(
  '/:id',
  verifyToken,
  superAdminOrAdminMiddleware,
  adminUpdateAnyDress
);

router.patch(
  '/master/:masterDressId',
  verifyToken,
  superAdminOrAdminMiddleware,
     multerUpload([
    { name: "mediaUpload", maxCount: 100 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  adminUpdateMasterDress 
);

router.get(
  '/listings/stats',
  verifyToken,
  superAdminOrAdminMiddleware,
  getApprovalStatsController
);

router.get('/dress/:id',getDressByIdController)

export default router;
