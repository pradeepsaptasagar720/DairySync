import bcrypt from "bcryptjs";

/**
 * Hash plain password
 */
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}
