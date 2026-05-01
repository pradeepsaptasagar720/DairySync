import User from "../models/User.model.js";

/**
 * Generate unique ID with role-based prefix
 * F = Farmer, B = Buyer, E = Employee, A = Admin
 */
export const generateUniqueId = async (role) => {
  const prefixMap = {
    farmer: 'F',
    buyer: 'B', 
    employee: 'E',
    admin: 'A'
  };

  const prefix = prefixMap[role.toLowerCase()];
  if (!prefix) {
    throw new Error(`Invalid role: ${role}`);
  }

  let uniqueId;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    // Generate 6-digit number
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    uniqueId = `${prefix}${randomNumber}`;

    // Check if this ID already exists
    const existingUser = await User.findOne({ uniqueId });
    if (!existingUser) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error(`Failed to generate unique ID for role: ${role} after ${maxAttempts} attempts`);
  }

  return uniqueId;
};

/**
 * Get role from unique ID prefix
 */
export const getRoleFromId = (uniqueId) => {
  if (!uniqueId || uniqueId.length < 1) {
    return null;
  }

  const prefix = uniqueId.charAt(0).toUpperCase();
  const roleMap = {
    'F': 'farmer',
    'B': 'buyer',
    'E': 'employee', 
    'A': 'admin'
  };

  return roleMap[prefix] || null;
};

/**
 * Validate unique ID format
 */
export const validateUniqueId = (uniqueId) => {
  if (!uniqueId) {
    return { valid: false, message: 'Unique ID is required' };
  }

  // Check format: 1 letter + 6 digits
  const pattern = /^[FBEA]\d{6}$/;
  if (!pattern.test(uniqueId)) {
    return { 
      valid: false, 
      message: 'Invalid ID format. Must be 1 letter (F/B/E/A) followed by 6 digits' 
    };
  }

  const role = getRoleFromId(uniqueId);
  if (!role) {
    return { valid: false, message: 'Invalid role prefix' };
  }

  return { valid: true, role };
};