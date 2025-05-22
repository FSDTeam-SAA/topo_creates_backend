import express from 'express'
import { deleteDress, getAllDresses, getDressById, getDressesByLender, listDress, updateDress } from './listings.controller.js'
import { adminLenderMiddleware, adminMiddleware, lenderMiddleware, verifyToken } from '../../../core/middlewares/authMiddleware.js'
import { multerUpload } from '../../../core/middlewares/multer.js'

const router = express.Router()

router.post('/listings', verifyToken, lenderMiddleware, multerUpload([{ name: "media", maxCount: 5 }]),listDress)
router.get('/', verifyToken, adminMiddleware, getAllDresses)
router.get('/:id', verifyToken, adminLenderMiddleware, getDressById)
router.get('/:lenderId', verifyToken, adminMiddleware, getDressesByLender)
router.patch('/:id', verifyToken, adminLenderMiddleware, multerUpload([{ name: "media", maxCount: 5 }]),updateDress)
router.delete('/:id', verifyToken, adminLenderMiddleware, deleteDress)

export default router