import { asyncHandler } from "./error.middleware.js";

/**
 * Employee role-based access control middleware
 * @param {string} requiredRole - The required employee role
 * @returns {Function} Middleware function
 */
export const employeeRoleMiddleware = (requiredRole) => {
  return asyncHandler(async (req, res, next) => {
    const user = req.user;

    // Allow admin users to access all employee endpoints
    if (user.role === "admin") {
      return next();
    }

    // Check if user is an employee
    if (user.role !== "employee") {
      return res.status(403).json({
        success: false,
        error: {
          code: "INVALID_ROLE",
          message: "Access denied. Employee role required."
        }
      });
    }

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

    // Check if employee has the required role
    if (user.employeeRole !== requiredRole) {
      return res.status(403).json({
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: `Access denied. ${requiredRole.replace('_', ' ')} role required.`
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

    next();
  });
};