import bcrypt from "bcryptjs";
import User from "../models/User.model.js";
import { generateUniqueId } from "../utils/idGenerator.js";

/**
 * Employee Service
 * Business logic for employee management operations
 */

class EmployeeService {
  
  /**
   * Generate unique credentials for employee
   * @param {string} baseName - Base name for username generation
   * @returns {Promise<{username: string, password: string}>}
   */
  static async generateEmployeeCredentials(baseName) {
    if (!baseName || typeof baseName !== 'string') {
      throw new Error('Base name is required and must be a string');
    }

    // Generate username based on base name
    let username = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Ensure minimum username length
    if (username.length < 3) {
      username = `emp${username}`;
    }
    
    // Ensure username is unique
    let counter = 1;
    let finalUsername = username;
    
    while (await User.findOne({ username: finalUsername })) {
      finalUsername = `${username}${counter}`;
      counter++;
      
      // Prevent infinite loop
      if (counter > 9999) {
        throw new Error('Unable to generate unique username');
      }
    }

    // Generate secure temporary password
    const password = this.generateSecurePassword();

    return {
      username: finalUsername,
      password
    };
  }

  /**
   * Generate secure temporary password
   * @param {number} length - Password length (default: 12)
   * @returns {string}
   */
  static generateSecurePassword(length = 12) {
    if (length < 8) {
      throw new Error('Password length must be at least 8 characters');
    }

    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = "";
    
    // Ensure at least one character from each required type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill remaining length with random characters
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password to randomize character positions
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Validate employee data before creation
   * @param {Object} employeeData - Employee data to validate
   * @returns {Object} Validation result
   */
  static validateEmployeeData(employeeData) {
    const errors = [];
    const { username, mobile, email, employeeRole } = employeeData;

    // Required field validation
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      errors.push('Username is required and must be a non-empty string');
    }

    if (!mobile || typeof mobile !== 'string') {
      errors.push('Mobile number is required');
    } else if (!/^\d{10}$/.test(mobile)) {
      errors.push('Mobile number must be exactly 10 digits');
    }

    if (!employeeRole || typeof employeeRole !== 'string') {
      errors.push('Employee role is required');
    } else {
      const validRoles = ['milk_collector', 'delivery_boy', 'loan_feed_manager'];
      if (!validRoles.includes(employeeRole)) {
        errors.push(`Employee role must be one of: ${validRoles.join(', ')}`);
      }
    }

    // Optional field validation
    if (email && (typeof email !== 'string' || !this.isValidEmail(email))) {
      errors.push('Email must be a valid email address');
    }

    // Username format validation
    if (username && (username.length < 3 || username.length > 50)) {
      errors.push('Username must be between 3 and 50 characters');
    }

    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Assign role-specific permissions to employee
   * @param {string} employeeRole - Employee role
   * @returns {Object} Permission configuration
   */
  static assignEmployeePermissions(employeeRole) {
    const basePermissions = {
      canAccessEmployeeDashboard: true,
      canViewOwnProfile: true,
      canChangePassword: true
    };

    const rolePermissions = {
      milk_collector: {
        ...basePermissions,
        canAccessAllEmployeePages: true,
        canAccessMilkCollection: true,
        canRecordMilkEntries: true,
        canViewFarmerList: true,
        canGenerateCollectionReports: true,
        // Removed delivery access for milk collectors
        canViewDeliveryRequests: false,
        canModifyDeliveryRequests: false,
        canApproveDeliveryRequests: false
      },
      
      delivery_boy: {
        ...basePermissions,
        canAccessDeliveryRequests: true,
        canManageDeliveries: true,
        canViewBuyerList: true,
        canUpdateDeliveryStatus: true,
        canGenerateDeliveryReports: true,
        // Restricted to delivery requests page only
        canAccessOtherEmployeePages: false
      },
      
      loan_feed_manager: {
        ...basePermissions,
        canAccessLoanManagement: true,
        canAccessFeedManagement: true,
        canManageLoans: true,
        canManageFeeds: true,
        canApproveLoanRequests: true,
        canApproveFeedRequests: true,
        canGenerateLoanReports: true,
        canGenerateFeedReports: true,
        // Restricted to loan and feed management only
        canAccessMilkCollection: false,
        canAccessDeliveryRequests: false
      }
    };

    return rolePermissions[employeeRole] || rolePermissions.milk_collector;
  }

  /**
   * Hash password securely
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  static async hashPassword(password) {
    if (!password || typeof password !== 'string') {
      throw new Error('Password is required and must be a string');
    }

    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Password match result
   */
  static async verifyPassword(password, hash) {
    if (!password || !hash) {
      return false;
    }

    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate employee unique ID
   * @returns {Promise<string>} Unique employee ID
   */
  static async generateEmployeeUniqueId() {
    return await generateUniqueId('employee');
  }

  /**
   * Validate employee role
   * @param {string} role - Employee role to validate
   * @returns {boolean} Validation result
   */
  static isValidEmployeeRole(role) {
    const validRoles = ['milk_collector', 'delivery_boy', 'loan_feed_manager'];
    return validRoles.includes(role);
  }

  /**
   * Get employee dashboard configuration based on role
   * @param {string} employeeRole - Employee role
   * @returns {Object} Dashboard configuration
   */
  static getEmployeeDashboardConfig(employeeRole) {
    const configs = {
      milk_collector: {
        dashboardType: 'milk_collector',
        primaryActions: ['record_milk_entry', 'view_farmers', 'generate_reports'],
        availableModules: ['milk_collection', 'farmer_management', 'reports'],
        defaultRoute: '/employee/milk-collection',
        restrictedActions: ['modify_delivery_requests', 'approve_delivery_requests', 'access_delivery_requests']
      },
      
      delivery_boy: {
        dashboardType: 'delivery_boy',
        primaryActions: ['manage_deliveries', 'update_status', 'view_buyers'],
        availableModules: ['delivery_requests'],
        defaultRoute: '/employee/delivery-requests',
        restrictedPages: ['milk_collection', 'loan_management', 'feed_management']
      },
      
      loan_feed_manager: {
        dashboardType: 'loan_feed_manager',
        primaryActions: ['manage_loans', 'manage_feeds', 'approve_requests', 'generate_reports'],
        availableModules: ['loan_management', 'feed_management', 'reports'],
        defaultRoute: '/employee/loan-feed-management',
        restrictedPages: ['milk_collection', 'delivery_requests']
      }
    };

    return configs[employeeRole] || configs.milk_collector;
  }

  /**
   * Check if employee can perform specific action
   * @param {Object} employee - Employee object
   * @param {string} action - Action to check
   * @returns {boolean} Permission result
   */
  static canEmployeePerformAction(employee, action) {
    if (!employee || !employee.isActive) {
      return false;
    }

    const permissions = this.assignEmployeePermissions(employee.employeeRole);
    return permissions[action] || false;
  }

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Validation result
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate employee search filters
   * @param {Object} searchParams - Search parameters
   * @returns {Object} MongoDB filter object
   */
  static buildEmployeeSearchFilter(searchParams) {
    const { employeeRole, isActive, approved, search, dateFrom, dateTo } = searchParams;
    
    let filter = { role: 'employee' };

    if (employeeRole && this.isValidEmployeeRole(employeeRole)) {
      filter.employeeRole = employeeRole;
    }

    if (isActive !== undefined) {
      filter.isActive = Boolean(isActive);
    }

    if (approved !== undefined) {
      filter.approved = Boolean(approved);
    }

    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      filter.$or = [
        { username: searchRegex },
        { uniqueId: searchRegex },
        { mobile: searchRegex },
        { email: searchRegex },
        { address: searchRegex }
      ];
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    return filter;
  }

  /**
   * Format employee data for API response
   * @param {Object} employee - Employee document
   * @param {boolean} includeCredentials - Whether to include credentials
   * @returns {Object} Formatted employee data
   */
  static formatEmployeeResponse(employee, includeCredentials = false) {
    const formatted = {
      id: employee._id,
      uniqueId: employee.uniqueId,
      username: employee.username,
      mobile: employee.mobile,
      email: employee.email,
      address: employee.address,
      role: employee.role,
      employeeRole: employee.employeeRole,
      isActive: employee.isActive,
      approved: employee.approved,
      isVerified: employee.isVerified,
      passwordResetRequired: employee.passwordResetRequired,
      lastLogin: employee.lastLogin,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      createdBy: employee.createdBy
    };

    if (includeCredentials && employee.tempCredentials) {
      formatted.credentials = employee.tempCredentials;
    }

    return formatted;
  }
}

export default EmployeeService;