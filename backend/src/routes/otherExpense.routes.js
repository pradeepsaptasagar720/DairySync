import express from 'express';
import { 
  getAllOtherExpenses,
  createOtherExpense,
  updateOtherExpense,
  deleteOtherExpense,
  processPayment
} from '../controllers/otherExpense.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication and admin authorization
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// Get all other expenses with filters
router.get('/', getAllOtherExpenses);

// Create new expense
router.post('/', createOtherExpense);

// Update expense
router.put('/:id', updateOtherExpense);

// Delete expense
router.delete('/:id', deleteOtherExpense);

// Process payment for an expense
router.post('/:id/pay', processPayment);

export default router;
