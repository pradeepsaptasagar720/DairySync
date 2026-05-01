import express from "express";
import { getLandingStats, getDairyInfo } from "../controllers/admin.controller.js";
import Delivery from "../models/Delivery.model.js";

const router = express.Router();

// Public route for landing page statistics
router.get("/landing-stats", getLandingStats);

// Public route for dairy time information (accessible to all users)
router.get("/dairy-info", getDairyInfo);

// Debug route: check active orders in DB (remove in production)
router.get("/debug-orders", async (req, res) => {
  try {
    const activeOrders = await Delivery.find({
      status: { $in: ["Pending", "Accepted", "Out for Delivery"] }
    }).select("milkType quantity status deliveryDate createdAt buyer").lean();
    
    const allOrders = await Delivery.find({})
      .select("milkType quantity status deliveryDate createdAt")
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      activeOrderCount: activeOrders.length,
      activeOrders: activeOrders.map(o => ({
        id: o._id,
        milkType: o.milkType,
        quantity: o.quantity,
        status: o.status,
        deliveryDate: o.deliveryDate,
        createdAt: o.createdAt
      })),
      last10Orders: allOrders.map(o => ({
        id: o._id,
        milkType: o.milkType,
        quantity: o.quantity,
        status: o.status,
        deliveryDate: o.deliveryDate,
        createdAt: o.createdAt
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;