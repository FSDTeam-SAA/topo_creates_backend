import express from 'express';
import {
  deleteDress,
  getAllDresses,
  getDressById,
  getDressesByLender,
  getLenderStatsController,
  listDress,
  updateDress
} from './listings.controller.js';
import {
  adminLenderSuperadminMiddleware,
  lenderMiddleware,
  superAdminOrAdminMiddleware,
  verifyToken
} from '../../../core/middlewares/authMiddleware.js';

const router = express.Router();

router.post('/listings', verifyToken, lenderMiddleware, multerUpload([{ name: "media", maxCount: 5 }]),listDress)
router.get('/', verifyToken, adminMiddleware, getAllDresses)
router.get('/', verifyToken, lenderMiddleware, getAllDresses)
router.get('/:id', verifyToken, adminLenderMiddleware, getDressById)
router.get('/:lenderId', verifyToken, adminMiddleware, getDressesByLender)
router.patch('/:id', verifyToken, adminLenderMiddleware, multerUpload([{ name: "media", maxCount: 5 }]),updateDress)
router.delete('/:id', verifyToken, adminLenderMiddleware, deleteDress)

// Create a new dress listing (lender only)
router.post('/listings', verifyToken, lenderMiddleware, listDress);

// Lender fetches their own dresses
router.get('/', verifyToken, adminLenderSuperadminMiddleware, getDressesByLender);

// Lender stats
router.get(
  '/listings/stats',
  verifyToken,
  lenderMiddleware,
  getLenderStatsController
);

// ---------------- ADMIN ROUTES ---------------- //

// Admin fetches all dresses
router.get('/admin/', verifyToken, superAdminOrAdminMiddleware, getAllDresses);

// Admin fetches stats of a specific lender
router.get(
  '/admin/lender/:lenderId/stats',
  verifyToken,
  superAdminOrAdminMiddleware,
  getLenderStatsController
);

// ---------------- SHARED ROUTES ---------------- //

// Dress by ID (admin or lender who owns it)
router
  .route('/listings/:id')
  .get(verifyToken, adminLenderSuperadminMiddleware, getDressById)
  .patch(
    verifyToken,
    adminLenderSuperadminMiddleware,
    updateDress
  )
  .delete(verifyToken, adminLenderSuperadminMiddleware, deleteDress);

export default router;
