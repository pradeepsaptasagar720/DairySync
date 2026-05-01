import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import { env } from "../config/env.js";

/**
 * Verify JWT and attach user to request
 */
export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = {
      id: user._id,
      role: user.role,
      employeeRole: user.employeeRole,
      isActive: user.isActive,
      isAccountLocked: user.isAccountLocked,
      username: user.username
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
