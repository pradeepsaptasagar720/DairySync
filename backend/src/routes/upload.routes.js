import express from "express";

const router = express.Router();

router.post("/", (req, res) => {
  res.json({ message: "Upload endpoint ready" });
});

export default router;
