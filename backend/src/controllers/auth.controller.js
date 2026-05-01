import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.model.js";
import AuthOTP from "../models/AuthOTP.model.js";
import { env } from "../config/env.js";
import { generateOTP } from "../utils/otpGenerator.js";
import { generateUniqueId } from "../utils/idGenerator.js";
import { asyncHandler } from "../middlewares/error.middleware.js";

/* =========================
   REGISTER
========================= */
export const register = asyncHandler(async (req, res) => {
  const { username, mobile, password, role } = req.body;

  if (!username || !mobile || !password || !role) {
    return res.status(400).json({ 
      success: false,
      error: {
        code: "MISSING_FIELDS",
        message: "All fields are required"
      }
    });
  }

  // 🔒 Block admin registration
  if (role === "admin") {
    return res.status(403).json({ 
      success: false,
      error: {
        code: "ADMIN_REGISTRATION_BLOCKED",
        message: "Admin registration is not allowed"
      }
    });
  }

  // 🔒 Block employee registration through public signup
  if (role === "employee") {
    return res.status(403).json({ 
      success: false,
      error: {
        code: "EMPLOYEE_REGISTRATION_BLOCKED",
        message: "Employee accounts can only be created by administrators. Please contact the dairy management for employment opportunities."
      }
    });
  }

  // 🔒 Validate allowed roles for public registration
  const allowedPublicRoles = ["farmer", "buyer"];
  if (!allowedPublicRoles.includes(role)) {
    return res.status(400).json({ 
      success: false,
      error: {
        code: "INVALID_ROLE",
        message: "Invalid role. Only farmer and buyer accounts can be created through public registration."
      }
    });
  }

  // 🔒 Reserve admin mobile
  if (mobile === "9999999999") {
    return res.status(403).json({
      success: false,
      error: {
        code: "RESERVED_MOBILE",
        message: "This mobile number is reserved"
      }
    });
  }

  if (!/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ 
      success: false,
      error: {
        code: "INVALID_MOBILE",
        message: "Invalid mobile number"
      }
    });
  }

  const existing = await User.findOne({
    $or: [{ mobile }, { username }],
  });

  if (existing) {
    return res.status(400).json({ 
      success: false,
      error: {
        code: "USER_EXISTS",
        message: "User already exists"
      }
    });
  }

  const hashed = await bcrypt.hash(password, 10);

  // Don't generate unique ID during registration - it will be generated after admin approval
  const user = await User.create({
    username,
    mobile,
    password: hashed,
    role,
    isVerified: false,
  });

  const otpCode = generateOTP();
  await AuthOTP.create({
    mobile,
    otp: otpCode,
    purpose: "REGISTER",
  });

  console.log("OTP (demo):", otpCode);

  return res.status(201).json({
    success: true,
    data: { 
      userId: user._id
    },
    message: `Registration successful! Please verify OTP. Your unique ID will be assigned after admin approval.`
  });
});

/* =========================
   VERIFY OTP
========================= */
export const verifyOtp = asyncHandler(async (req, res) => {
  const { mobile, otp } = req.body;

  const record = await AuthOTP.findOne({ mobile, otp });
  if (!record) {
    return res.status(400).json({ 
      success: false,
      error: {
        code: "INVALID_OTP",
        message: "Invalid or expired OTP"
      }
    });
  }

  // ✅ Mark user as verified
  await User.updateOne({ mobile }, { isVerified: true });

  // ✅ Remove OTP records
  await AuthOTP.deleteMany({ mobile });

  return res.status(200).json({
    success: true,
    message: "OTP verified successfully"
  });
});

/* =========================
   RESEND OTP
========================= */
export const resendOtp = asyncHandler(async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ 
      success: false,
      error: {
        code: "MISSING_MOBILE",
        message: "Mobile number is required"
      }
    });
  }

  const user = await User.findOne({ mobile });
  if (!user) {
    return res.status(404).json({ 
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found"
      }
    });
  }

  // Generate new OTP
  const otpCode = generateOTP();
  
  // Delete old OTPs for this mobile
  await AuthOTP.deleteMany({ mobile });
  
  // Create new OTP
  await AuthOTP.create({
    mobile,
    otp: otpCode,
    purpose: "REGISTER",
  });

  console.log("Resent OTP (demo):", otpCode);

  return res.status(200).json({
    success: true,
    message: "OTP resent successfully"
  });
});

/* =========================
   LOGIN (ADMIN OTP BYPASS)
========================= */
export const login = asyncHandler(async (req, res) => {
  const { mobile, password, role } = req.body;

  if (!mobile || !password || !role) {
    return res.status(400).json({ 
      success: false,
      error: {
        code: "MISSING_FIELDS",
        message: "All fields are required"
      }
    });
  }

  if (!/^\d{10}$/.test(mobile)) {
    return res.status(400).json({ 
      success: false,
      error: {
        code: "INVALID_MOBILE",
        message: "Invalid mobile number"
      }
    });
  }

  const user = await User.findOne({ mobile });
  if (!user) {
    return res.status(404).json({ 
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found"
      }
    });
  }

  console.log("LOGIN ATTEMPT:", {
    mobile: user.mobile,
    dbRole: user.role,
    reqRole: role,
    isVerified: user.isVerified,
  });

  // ✅ FIX 1: ROLE CHECK (CASE-INSENSITIVE)
  if (user.role.toLowerCase() !== role.toLowerCase()) {
    return res.status(403).json({ 
      success: false,
      error: {
        code: "INVALID_ROLE",
        message: "Invalid role for this account"
      }
    });
  }

  // ✅ FIX 2: OTP REQUIRED ONLY FOR NON-ADMIN
  if (user.role !== "admin" && !user.isVerified) {
    return res.status(403).json({
      success: false,
      error: {
        code: "OTP_NOT_VERIFIED",
        message: "OTP not verified. Please verify your account."
      }
    });
  }

  // ✅ FIX 2.5: APPROVAL REQUIRED FOR NON-ADMIN
  if (user.role !== "admin" && !user.approved) {
    return res.status(403).json({
      success: false,
      error: {
        code: "APPROVAL_PENDING",
        message: "Sorry, you cannot log in until the admin approves you."
      }
    });
  }

  // ✅ FIX 3: PASSWORD CHECK (bcrypt)
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    // Increment failed login attempts for employees
    if (user.role === "employee") {
      await user.incrementFailedLogin();
    }
    
    return res.status(400).json({ 
      success: false,
      error: {
        code: "INVALID_PASSWORD",
        message: "Invalid password"
      }
    });
  }

  // Reset failed login attempts on successful login
  if (user.role === "employee" && user.failedLoginAttempts > 0) {
    await user.resetFailedLogin();
  }

  // ✅ EMPLOYEE SPECIFIC CHECKS
  if (user.role === "employee") {
    // Check if employee is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: "EMPLOYEE_INACTIVE",
          message: "Your employee account has been deactivated. Please contact your administrator."
        }
      });
    }

    // Check if account is locked
    if (user.isAccountLocked) {
      return res.status(423).json({
        success: false,
        error: {
          code: "ACCOUNT_LOCKED",
          message: "Account is temporarily locked due to multiple failed login attempts. Please try again later."
        }
      });
    }

    // Check if employee role is defined
    if (!user.employeeRole) {
      return res.status(403).json({
        success: false,
        error: {
          code: "EMPLOYEE_ROLE_UNDEFINED",
          message: "Employee role not assigned. Please contact your administrator."
        }
      });
    }

    // Validate employee role against allowed roles
    const allowedRoles = ["milk_collector", "delivery_boy", "loan_feed_manager"];
    if (!allowedRoles.includes(user.employeeRole)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "INVALID_EMPLOYEE_ROLE",
          message: "Invalid employee role assigned. Please contact your administrator."
        }
      });
    }

    // Update last login timestamp
    await User.findByIdAndUpdate(user._id, { 
      lastLogin: new Date() 
    });

    // Check if password reset is required (first login)
    if (user.passwordResetRequired) {
      return res.status(200).json({
        success: true,
        data: {
          token: jwt.sign(
            { id: user._id, role: user.role, employeeRole: user.employeeRole },
            env.JWT_SECRET,
            { expiresIn: "1d" }
          ),
          id: user._id,
          role: user.role,
          employeeRole: user.employeeRole,
          uniqueId: user.uniqueId,
          username: user.username,
          passwordResetRequired: true
        },
        message: "Login successful. Password change required."
      });
    }
  }

  // ✅ FIX 4: TOKEN CREATION (Enhanced for employees)
  const tokenPayload = { 
    id: user._id, 
    role: user.role 
  };

  // Add employee role to token for employees
  if (user.role === "employee" && user.employeeRole) {
    tokenPayload.employeeRole = user.employeeRole;
  }

  const token = jwt.sign(tokenPayload, env.JWT_SECRET, { expiresIn: "1d" });

  // ✅ FIX 5: RESPONSE MATCHES FRONTEND (Enhanced for employees)
  const responseData = {
    token,
    id: user._id,
    role: user.role,
    uniqueId: user.uniqueId,
    username: user.username
  };

  // Add employee-specific data
  if (user.role === "employee") {
    responseData.employeeRole = user.employeeRole;
    responseData.isActive = user.isActive;
    responseData.passwordResetRequired = user.passwordResetRequired || false;
    responseData.redirectTo = user.getRedirectPath();
    responseData.permissions = {
      canAccessPages: user.getAllowedPages(),
      restrictedPages: getAllPages().filter(page => !user.getAllowedPages().includes(page))
    };
  }

  return res.status(200).json({
    success: true,
    data: responseData,
    message: "Login successful"
  });
});

/**
 * Helper functions for employee permissions
 */
function getAllPages() {
  return [
    'milk-collection', 'delivery-requests', 'manage-farmers', 'manage-buyers', 
    'generate-reports', 'payment-status', 'dairy-time', 'transported-milk', 
    'animal-info', 'loan-management', 'feed-management', 'loan-feed-management', 
    'feed-stock-management'
  ];
}

/* =========================
   FORGOT PASSWORD
========================= */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { mobile } = req.body;

  const user = await User.findOne({ mobile });
  if (!user) {
    return res.status(404).json({ 
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found"
      }
    });
  }

  const otpCode = generateOTP();
  await AuthOTP.create({
    mobile,
    otp: otpCode,
    purpose: "RESET",
  });

  console.log("RESET OTP (demo):", otpCode);
  // SMS sending is handled separately if needed

  return res.json({ 
    success: true,
    message: "OTP sent for password reset" 
  });
});

/* =========================
   VERIFY RESET OTP (without deleting — used for step-by-step UI)
========================= */
export const verifyResetOtp = asyncHandler(async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({
      success: false,
      error: { code: "MISSING_FIELDS", message: "Mobile and OTP are required" }
    });
  }

  const record = await AuthOTP.findOne({ mobile, otp, purpose: "RESET" });
  if (!record) {
    return res.status(400).json({
      success: false,
      error: { code: "INVALID_OTP", message: "Invalid or expired OTP" }
    });
  }

  return res.json({ success: true, message: "OTP verified" });
});

/* =========================
   RESET PASSWORD
========================= */
export const resetPassword = asyncHandler(async (req, res) => {
  const { mobile, otp, newPassword } = req.body;

  const record = await AuthOTP.findOne({ mobile, otp });
  if (!record) {
    return res.status(400).json({ 
      success: false,
      error: {
        code: "INVALID_OTP",
        message: "Invalid OTP"
      }
    });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await User.updateOne({ mobile }, { password: hashed });
  await AuthOTP.deleteMany({ mobile });

  return res.json({ 
    success: true,
    message: "Password reset successful" 
  });
});

/* =========================
   GET PROFILE
========================= */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found"
      }
    });
  }

  res.json({
    success: true,
    data: user,
    message: "Profile retrieved successfully"
  });
});

/* =========================
   UPDATE PROFILE
========================= */
export const updateProfile = asyncHandler(async (req, res) => {
  const { username, email, address } = req.body;
  
  if (!username) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_USERNAME",
        message: "Username is required"
      }
    });
  }

  // Check if username is already taken by another user
  const existingUser = await User.findOne({ 
    username, 
    _id: { $ne: req.user.id } 
  });

  if (existingUser) {
    return res.status(400).json({
      success: false,
      error: {
        code: "USERNAME_TAKEN",
        message: "Username is already taken"
      }
    });
  }

  const updateData = { username };
  if (email) updateData.email = email;
  if (address) updateData.address = address;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    updateData,
    { new: true }
  ).select('-password');

  res.json({
    success: true,
    data: user,
    message: "Profile updated successfully"
  });
});

/* =========================
   CHANGE PASSWORD
========================= */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_FIELDS",
        message: "Current password and new password are required"
      }
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      error: {
        code: "WEAK_PASSWORD",
        message: "New password must be at least 6 characters long"
      }
    });
  }

  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found"
      }
    });
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_CURRENT_PASSWORD",
        message: "Current password is incorrect"
      }
    });
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  
  // Update password
  await User.findByIdAndUpdate(req.user.id, { 
    password: hashedNewPassword 
  });

  res.json({
    success: true,
    message: "Password changed successfully"
  });
});

/* =========================
   DELETE ACCOUNT
========================= */
export const deleteAccount = asyncHandler(async (req, res) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_PASSWORD",
        message: "Password is required to delete account"
      }
    });
  }

  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found"
      }
    });
  }

  // Prevent admin from deleting their account
  if (user.role === "admin") {
    return res.status(403).json({
      success: false,
      error: {
        code: "ADMIN_DELETE_FORBIDDEN",
        message: "Admin accounts cannot be deleted"
      }
    });
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_PASSWORD",
        message: "Password is incorrect"
      }
    });
  }

  // Delete user account
  await User.findByIdAndDelete(req.user.id);

  res.json({
    success: true,
    message: "Account deleted successfully"
  });
});
/* =========================
   EMPLOYEE FIRST LOGIN PASSWORD CHANGE
========================= */
export const employeeChangePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_FIELDS",
        message: "Current password and new password are required"
      }
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      error: {
        code: "WEAK_PASSWORD",
        message: "New password must be at least 8 characters long"
      }
    });
  }

  // Validate password complexity
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(newPassword)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "WEAK_PASSWORD",
        message: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      }
    });
  }

  const user = await User.findById(req.user.id);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found"
      }
    });
  }

  // Only allow employees to use this endpoint
  if (user.role !== "employee") {
    return res.status(403).json({
      success: false,
      error: {
        code: "INVALID_ROLE",
        message: "This endpoint is only for employee accounts"
      }
    });
  }

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_CURRENT_PASSWORD",
        message: "Current password is incorrect"
      }
    });
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  
  // Update password and remove reset requirement
  await User.findByIdAndUpdate(req.user.id, { 
    password: hashedNewPassword,
    passwordResetRequired: false
  });

  res.json({
    success: true,
    message: "Password changed successfully. You can now access your dashboard."
  });
});

/* =========================
   GET EMPLOYEE DASHBOARD ROUTE
========================= */
export const getEmployeeDashboardRoute = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found"
      }
    });
  }

  if (user.role !== "employee") {
    return res.status(403).json({
      success: false,
      error: {
        code: "INVALID_ROLE",
        message: "This endpoint is only for employee accounts"
      }
    });
  }

  if (!user.isActive) {
    return res.status(403).json({
      success: false,
      error: {
        code: "EMPLOYEE_INACTIVE",
        message: "Your employee account has been deactivated"
      }
    });
  }

  // Determine dashboard route based on employee role
  let dashboardRoute = "/employee"; // Default route
  
  switch (user.employeeRole) {
    case "milk_collector":
      dashboardRoute = "/employee";
      break;
    case "delivery_boy":
      dashboardRoute = "/delivery";
      break;
    case "loan_feed_manager":
      dashboardRoute = "/loanfeed";
      break;
    default:
      dashboardRoute = "/employee";
  }

  res.json({
    success: true,
    data: {
      employeeRole: user.employeeRole,
      dashboardRoute,
      isActive: user.isActive,
      passwordResetRequired: user.passwordResetRequired || false
    },
    message: "Employee dashboard route retrieved successfully"
  });
});