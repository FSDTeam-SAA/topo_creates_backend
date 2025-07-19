import express from 'express';
import { deleteApplication, getAllApplications, getApplicationById, newApplication, updateApplication } from './application.controller.js';
import { adminMiddleware,verifyToken } from '../../core/middlewares/authMiddleware.js';

const router = express.Router();

router.post('/apply', newApplication)
router.get('/', getAllApplications)
router.get('/:id', verifyToken,adminMiddleware, getApplicationById)
router.patch('/:id', updateApplication)
router.delete('/:id', verifyToken, adminMiddleware, deleteApplication)




export default router;