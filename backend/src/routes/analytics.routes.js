import express from "express";
import { adminAnalytics } from "../controllers/analytics.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

router.get(
  "/admin",
  authMiddleware,
  roleMiddleware("admin"),
  adminAnalytics
);

export default router;
