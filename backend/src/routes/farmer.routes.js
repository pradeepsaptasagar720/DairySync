import express from "express";
import { 
  getMilkHistory,
  getTodayMilkEntries,
  getDairyTime, 
  getAnimals, 
  addAnimal, 
  updateAnimal, 
  deleteAnimal, 
  getAnimalStats,
  getLoanHistory,
  getFeedHistory
} from "../controllers/farmer.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { roleMiddleware } from "../middlewares/role.middleware.js";

const router = express.Router();

// Apply authentication and farmer authorization to all routes
router.use(authMiddleware);
router.use(roleMiddleware("farmer"));

// Dairy time for farmers
router.get("/dairy-time", getDairyTime);

// Milk entries for farmers (read-only)
router.get("/today-milk-entries", getTodayMilkEntries);
router.get("/milk-history", getMilkHistory);

// Animal management routes
router.get("/animals", getAnimals);
router.post("/animals", addAnimal);
router.put("/animals/:animalId", updateAnimal);
router.delete("/animals/:animalId", deleteAnimal);
router.get("/animals/stats", getAnimalStats);

// Loan and Feed history routes
router.get("/loan-history", getLoanHistory);
router.get("/feed-history", getFeedHistory);

export default router;