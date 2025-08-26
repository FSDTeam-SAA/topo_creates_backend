import express from 'express'
import { deleteDress, getAllDresses, getDressById, getDressesByLender, getLenderStatsController, listDress, updateDress } from './listings.controller.js'
import { adminLenderMiddleware, adminMiddleware, lenderMiddleware, verifyToken } from '../../../core/middlewares/authMiddleware.js'
import { multerUpload } from '../../../core/middlewares/multer.js'

const router = express.Router()


// ---------------- LENDER ROUTES ---------------- //

// Create a new dress listing (lender only)
router.post(
  "/listings",
  verifyToken,
  lenderMiddleware,
  multerUpload([{ name: "media", maxCount: 5 }]),
  listDress
)

// Lender fetches their own dresses
router.get(
  "/",
  verifyToken,
  adminLenderMiddleware,
  getDressesByLender
)

// Lender stats
router.get(
  "/listings/stats",
  verifyToken,
  lenderMiddleware,
  getLenderStatsController
)


// ---------------- ADMIN ROUTES ---------------- //

// Admin fetches all dresses
router.get(
  "/admin/",
  verifyToken,
  adminMiddleware,
  getAllDresses
)

// Admin fetches stats of a specific lender
router.get(
  "/admin/lender/:lenderId/stats",
  verifyToken,
  adminMiddleware,
  getLenderStatsController
)


// ---------------- SHARED ROUTES ---------------- //

// Dress by ID (admin or lender who owns it)
router
  .route("/listings/:id")
  .get(verifyToken, adminLenderMiddleware, getDressById)
  .patch(
    verifyToken,
    adminLenderMiddleware,
    multerUpload([{ name: "media", maxCount: 5 }]),
    updateDress
  )
  .delete(verifyToken, adminLenderMiddleware, deleteDress)

export default router