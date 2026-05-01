import express from 'express';
import * as employeeSalaryController from '../controllers/employeeSalary.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleMiddleware } from '../middlewares/role.middleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Employee self-service: view own salary history — must be before admin roleMiddleware
router.get('/my-salary', roleMiddleware('employee', 'farmer', 'admin'), employeeSalaryController.getMyPaymentHistory);

// Admin-only middleware applied only to routes below this line
const adminOnly = roleMiddleware('admin');

// Process employee payment
router.post('/process', adminOnly, employeeSalaryController.processPayment);

// Get all employee payments with filters
router.get('/payments', adminOnly, employeeSalaryController.getEmployeePayments);

// Get employees for dropdown
router.get('/employees', adminOnly, employeeSalaryController.getEmployeesForPayment);

// Get payment history for specific employee
router.get('/employee/:employeeId/history', adminOnly, employeeSalaryController.getEmployeePaymentHistory);

// Get payment details by ID
router.get('/payment/:paymentId', adminOnly, employeeSalaryController.getPaymentById);

export default router;
