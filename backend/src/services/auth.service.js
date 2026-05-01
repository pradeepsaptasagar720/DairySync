import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

export function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    env.JWT_SECRET,
    { expiresIn: "1d" }
  );
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
