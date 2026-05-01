import express from "express";
import { downloadReport } from "../controllers/report.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/download", authMiddleware, downloadReport);

export default router;
