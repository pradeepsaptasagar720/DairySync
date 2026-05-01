import express from 'express';
import { getRevenueAnalytics, getComparisonData } from '../controllers/revenueAnalytics.controller.js';
import { asyncHandler } from '../middlewares/error.middleware.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';

const router = express.Router();

// Apply authentication and admin role check to all routes
router.use(authMiddleware, roleMiddleware('admin'));

// Get revenue analytics data
router.get('/', asyncHandler(getRevenueAnalytics));

// Get comparison data
router.get('/comparison', asyncHandler(getComparisonData));

export default router;
