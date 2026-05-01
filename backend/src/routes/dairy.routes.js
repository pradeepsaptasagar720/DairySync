import express from "express";
import { getDairyInfo } from "../controllers/admin.controller.js";

const router = express.Router();

// Public route for getting dairy info (no authentication required)
router.get("/info", getDairyInfo);

export default router;