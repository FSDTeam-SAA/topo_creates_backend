import express from 'express';
import { deleteApplication, getAllApplications, getApplicationById, newApplication, updateApplication } from './application.controller.js';
import { adminMiddleware,verifyToken } from '../../core/middlewares/authMiddleware.js';

const router = express.Router();



router.post('/apply', newApplication)
router.get('/', verifyToken, adminMiddleware, getAllApplications)
router.get('/:id', verifyToken,adminMiddleware, getApplicationById)
router.patch('/:id', verifyToken, adminMiddleware, updateApplication)
router.delete('/:id', verifyToken, adminMiddleware, deleteApplication)


export default router;