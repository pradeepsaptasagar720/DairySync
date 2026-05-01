import { asyncHandler } from "./error.middleware.js";

/**
 * Role-Based Routing Middleware
 * Handles dashboard routing based on employee roles and user types
 */

/**
 * Determine dashboard route based on user role and employee role
 * @param {Object} user - User object with role and employeeRole
 * @returns {string} Dashboard route
 */
export const getDashboardRoute = (user) => {
  if (!user || !user.role) {
    return "/auth/login";
  }

  switch (user.role) {
    case "admin":
      return "/admin";
    
    case "farmer":
      return "/farmer";
    
    case "buyer":
      return "/buyer";
    
    case "employee":
      if (!user.isActive) {
        return "/auth/login?error=account_inactive";
      }
      
      if (!user.employeeRole) {
        return "/employee"; // Default employee dashboard
      }
      
      switch (user.employeeRole) {
        case "milk_collector":
          return "/employee";
        case "delivery_boy":
          return "/delivery";
        case "loan_feed_manager":
          return "/loanfeed";
        default:
          return "/employee"; // Fallback for unrecognized employee roles
      }
    
    default:
      return "/auth/login";
  }
};

/**
 * Middleware to redirect users to appropriate dashboard after login
 */
export const redirectToDashboard = asyncHandler(async (req, res, next) => {
  if (req.user) {
    const dashboardRoute = getDashboardRoute(req.user);
    
    // Add dashboard route to response data
    if (res.locals.loginResponse) {
      res.locals.loginResponse.data.dashboardRoute = dashboardRoute;
    }
  }
  
  next();
});

/**
 * Middleware to validate employee access to role-specific routes
 */
export const validateEmployeeAccess = (requiredEmployeeRole) => {
  return asyncHandler(async (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required"
        }
      });
    }
    
    if (user.role !== "employee") {
      return res.status(403).json({
        success: false,
        error: {
          code: "INVALID_ROLE",
          message: "Employee access required"
        }
      });
    }
    
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: {
          code: "EMPLOYEE_INACTIVE",
          message: "Employee account is inactive"
        }
      });
    }
    
    if (requiredEmployeeRole && user.employeeRole !== requiredEmployeeRole) {
      return res.status(403).json({
        success: false,
        error: {
          code: "INSUFFICIENT_PERMISSIONS",
          message: `Access restricted to ${requiredEmployeeRole} employees`
        }
      });
    }
    
    next();
  });
};

/**
 * Middleware to validate admin access to employee management routes
 */
export const validateAdminAccess = asyncHandler(async (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required"
      }
    });
  }
  
  if (user.role !== "admin") {
    return res.status(403).json({
      success: false,
      error: {
        code: "ADMIN_ACCESS_REQUIRED",
        message: "Administrator access required"
      }
    });
  }
  
  next();
});

/**
 * Middleware to check if user can access specific functionality
 */
export const checkFunctionalityAccess = (functionality) => {
  return asyncHandler(async (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required"
        }
      });
    }
    
    const hasAccess = canUserAccessFunctionality(user, functionality);
    
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: {
          code: "ACCESS_DENIED",
          message: `Access denied for functionality: ${functionality}`
        }
      });
    }
    
    next();
  });
};

/**
 * Check if user can access specific functionality based on role
 * @param {Object} user - User object
 * @param {string} functionality - Functionality to check
 * @returns {boolean} Access permission
 */
export const canUserAccessFunctionality = (user, functionality) => {
  if (!user || !user.role) {
    return false;
  }
  
  // Admin has access to all functionality
  if (user.role === "admin") {
    return true;
  }
  
  // Employee-specific functionality checks
  if (user.role === "employee") {
    if (!user.isActive) {
      return false;
    }
    
    const employeePermissions = getEmployeePermissions(user.employeeRole);
    return employeePermissions[functionality] || false;
  }
  
  // Role-specific functionality for farmers and buyers
  const rolePermissions = {
    farmer: [
      "view_farmer_dashboard",
      "manage_animals",
      "view_milk_collection",
      "place_orders",
      "view_profile"
    ],
    buyer: [
      "view_buyer_dashboard",
      "place_orders",
      "view_order_history",
      "manage_deliveries",
      "view_profile"
    ]
  };
  
  const userPermissions = rolePermissions[user.role] || [];
  return userPermissions.includes(functionality);
};

/**
 * Get permissions for employee based on their role
 * @param {string} employeeRole - Employee role
 * @returns {Object} Permissions object
 */
export const getEmployeePermissions = (employeeRole) => {
  const basePermissions = {
    view_employee_dashboard: true,
    view_profile: true,
    change_password: true
  };
  
  const roleSpecificPermissions = {
    milk_collector: {
      ...basePermissions,
      access_milk_collection: true,
      record_milk_entries: true,
      view_farmer_list: true,
      generate_collection_reports: true
    },
    
    delivery_boy: {
      ...basePermissions,
      access_delivery_management: true,
      manage_deliveries: true,
      view_buyer_list: true,
      update_delivery_status: true,
      generate_delivery_reports: true
    },
    
    loan_feed_manager: {
      ...basePermissions,
      access_loan_management: true,
      access_feed_management: true,
      manage_loans: true,
      manage_feed_stock: true,
      generate_loan_reports: true,
      generate_feed_reports: true
    }
  };
  
  return roleSpecificPermissions[employeeRole] || roleSpecificPermissions.milk_collector;
};

/**
 * Middleware to handle password reset requirement for employees
 */
export const checkPasswordResetRequired = asyncHandler(async (req, res, next) => {
  const user = req.user;
  
  if (user && user.role === "employee" && user.passwordResetRequired) {
    // Allow access only to password change endpoints
    const allowedPaths = [
      "/api/auth/employee/change-password",
      "/api/auth/profile",
      "/api/auth/logout"
    ];
    
    if (!allowedPaths.includes(req.path)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "PASSWORD_RESET_REQUIRED",
          message: "Password change required before accessing other functionality"
        },
        data: {
          passwordResetRequired: true,
          allowedEndpoints: allowedPaths
        }
      });
    }
  }
  
  next();
});

/**
 * Generate role-based navigation menu
 * @param {Object} user - User object
 * @returns {Array} Navigation menu items
 */
export const generateNavigationMenu = (user) => {
  if (!user || !user.role) {
    return [];
  }
  
  const menus = {
    admin: [
      { label: "Dashboard", path: "/admin", icon: "dashboard" },
      { label: "User Management", path: "/admin/users", icon: "users" },
      { label: "Employee Management", path: "/admin/employees", icon: "employee" },
      { label: "Reports", path: "/admin/reports", icon: "reports" },
      { label: "Settings", path: "/admin/settings", icon: "settings" }
    ],
    
    farmer: [
      { label: "Dashboard", path: "/farmer", icon: "dashboard" },
      { label: "Animals", path: "/farmer/animals", icon: "animals" },
      { label: "Milk Collection", path: "/farmer/milk-collection", icon: "milk" },
      { label: "Orders", path: "/farmer/orders", icon: "orders" },
      { label: "Profile", path: "/farmer/profile", icon: "profile" }
    ],
    
    buyer: [
      { label: "Dashboard", path: "/buyer", icon: "dashboard" },
      { label: "Place Order", path: "/buyer/orders", icon: "order" },
      { label: "Order History", path: "/buyer/history", icon: "history" },
      { label: "Deliveries", path: "/buyer/deliveries", icon: "delivery" },
      { label: "Profile", path: "/buyer/profile", icon: "profile" }
    ],
    
    employee: {
      milk_collector: [
        { label: "Dashboard", path: "/employee", icon: "dashboard" },
        { label: "Milk Collection", path: "/employee/milk-collection", icon: "milk" },
        { label: "Farmers", path: "/employee/farmers", icon: "farmers" },
        { label: "Reports", path: "/employee/reports", icon: "reports" },
        { label: "Profile", path: "/employee/profile", icon: "profile" }
      ],
      
      delivery_boy: [
        { label: "Dashboard", path: "/delivery", icon: "dashboard" },
        { label: "Delivery Requests", path: "/delivery/requests", icon: "delivery" },
        { label: "Statistics", path: "/delivery/stats", icon: "stats" },
        { label: "History", path: "/delivery/history", icon: "history" },
        { label: "Profile", path: "/employee/profile", icon: "profile" }
      ],
      
      loan_feed_manager: [
        { label: "Dashboard", path: "/loanfeed", icon: "dashboard" },
        { label: "Loan Management", path: "/loanfeed/loans", icon: "loans" },
        { label: "Feed Management", path: "/loanfeed/feeds", icon: "feed" },
        { label: "Feed Stock", path: "/loanfeed/feed-stock", icon: "stock" },
        { label: "Statistics", path: "/loanfeed/stats", icon: "stats" },
        { label: "History", path: "/loanfeed/history", icon: "history" },
        { label: "Profile", path: "/employee/profile", icon: "profile" }
      ]
    }
  };
  
  if (user.role === "employee") {
    return menus.employee[user.employeeRole] || menus.employee.milk_collector;
  }
  
  return menus[user.role] || [];
};