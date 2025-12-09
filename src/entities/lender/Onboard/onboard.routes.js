
import express from 'express';

import { lenderMiddleware, verifyToken } from '../../../core/middlewares/authMiddleware.js';
import { getStripeLoginLink, onboardLender, refreshStripeAccountStatus } from './onboard.controller.js';


const router = express.Router();

// POST /api/stripe/onboard
router.post('/onboard', onboardLender);

// GET /api/stripe/refresh (must be called after return_url from Stripe)
router.get('/refresh', verifyToken, lenderMiddleware, refreshStripeAccountStatus);

router.get('/stripe/account/dashboard', verifyToken, lenderMiddleware, getStripeLoginLink);

export default router;
