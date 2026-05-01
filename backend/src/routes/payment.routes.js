import express from "express";
import {
  createPayment,
  getHistory,
} from "../controllers/payment.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/create", createPayment);
router.get("/history", getHistory);

export default router;
