import bcrypt from "bcryptjs";
import User from "../models/User.model.js";
import { generateUniqueId } from "../utils/idGenerator.js";
import { asyncHandler } from "../middlewares/error.middleware.js";

/**
 * Employee Admin Controller
 * Handles employee management operations for administrators
 */

/**
 * Create a new employee
 * POST /api/admin/employees
 */
export const createEmployee = asyncHandler(async (req, res) => {
  const { username, mobile, email, address, employeeRole, education, password, salary } = req.body;
  const adminId = req.user.id;

  // Validate required fields
  if (!username || !mobile || !employeeRole || !password) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MISSING_FIELDS",
        message: "Username, mobile number, employee role, and password are required"
      }
    });
  }

  // Validate password strength
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: {
        code: "WEAK_PASSWORD",
        message: "Password must be at least 8 characters long"
      }
    });
  }

  // Check password complexity (alphanumeric + special characters)
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_PASSWORD_FORMAT",
        message: "Password must contain at least one letter, one number, and one special character (@$!%*?&)"
      }
    });
  }

  // Validate employee role
  const validEmployeeRoles = ["milk_collector", "delivery_boy", "loan_feed_manager"];
  if (!validEmployeeRoles.includes(employeeRole)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_EMPLOYEE_ROLE",
        message: "Employee role must be one of: milk_collector, delivery_boy, loan_feed_manager"
      }
    });
  }

  // Validate mobile number format
  if (!/^\d{10}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_MOBILE",
        message: "Mobile number must be exactly 10 digits"
      }
    });
  }

  // Check for existing user with same mobile (prevent same employee working in different roles)
  const existingUser = await User.findOne({ mobile });

  if (existingUser) {
    const status = existingUser.isActive !== false ? 'Active' : 'Inactive';
    return res.status(400).json({
      success: false,
      error: {
        code: "MOBILE_EXISTS",
        message: `This mobile number is already registered!\n\nEmployee: ${existingUser.username}\nStatus: ${status}\nRole: ${existingUser.employeeRole}\n\nSame employee cannot work in different roles. One employee must work in only one role.`
      }
    });
  }

  // Check for existing username
  const existingUsername = await User.findOne({ username });
  if (existingUsername) {
    return res.status(400).json({
      success: false,
      error: {
        code: "USERNAME_EXISTS", 
        message: "Username already exists. Please choose a different username."
      }
    });
  }

  try {
    // Use provided password or generate unique credentials
    let credentials;
    let finalPassword;
    
    if (password && password.trim()) {
      // Use admin-provided password
      credentials = await generateEmployeeCredentials(username);
      finalPassword = password.trim();
    } else {
      // Generate unique credentials with auto-generated password
      credentials = await generateEmployeeCredentials(username);
      finalPassword = credentials.password;
    }
    
    // Generate unique ID for the employee
    const uniqueId = await generateUniqueId("employee");

    // Hash the password
    const hashedPassword = await bcrypt.hash(finalPassword, 10);

    // Create employee user
    const employee = await User.create({
      username: credentials.username,
      mobile,
      email: email || undefined,
      address: address || undefined,
      education: education || undefined,
      salary: salary || undefined,
      password: hashedPassword,
      role: "employee",
      employeeRole,
      uniqueId,
      isActive: true,
      approved: true, // Admin-created employees are auto-approved
      isVerified: true, // Admin-created employees are auto-verified
      passwordResetRequired: password && password.trim() ? false : true, // Don't require reset if admin set password
      createdBy: adminId
    });

    // Return employee data with credentials (shown only once)
    res.status(201).json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          uniqueId: employee.uniqueId,
          username: employee.username,
          mobile: employee.mobile,
          email: employee.email,
          address: employee.address,
          education: employee.education,
          role: employee.role,
          employeeRole: employee.employeeRole,
          isActive: employee.isActive,
          approved: employee.approved,
          createdAt: employee.createdAt,
          createdBy: employee.createdBy
        },
        credentials: {
          username: credentials.username,
          password: finalPassword,
          mobile: mobile,
          loginInstructions: "Use your mobile number and password to login directly to your assigned role module"
        }
      },
      message: `Employee created successfully! Unique ID: ${uniqueId}. Please provide these credentials to the employee.`
    });

  } catch (error) {
    console.error("Employee creation error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "CREATION_FAILED",
        message: "Failed to create employee account"
      }
    });
  }
});

/**
 * Get all employees with filtering and search
 * GET /api/admin/employees
 */
export const getEmployees = asyncHandler(async (req, res) => {
  const { 
    employeeRole, 
    approved, 
    search, 
    page = 1, 
    limit = 100, // Increased to get all employees
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object - include both active and inactive employees
  let filter = { role: "employee" };

  if (employeeRole) {
    filter.employeeRole = employeeRole;
  }

  if (approved !== undefined) {
    filter.approved = approved === 'true';
  }

  if (search) {
    filter.$or = [
      { username: { $regex: search, $options: 'i' } },
      { uniqueId: { $regex: search, $options: 'i' } },
      { mobile: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } }
    ];
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

  try {
    // Get all employees (both active and inactive)
    const employees = await User.find(filter)
      .select('-password')
      .populate('createdBy', 'username uniqueId')
      .populate('deletedBy', 'username uniqueId')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Get summary statistics (only active employees for stats)
    const summary = await User.aggregate([
      { $match: { role: "employee", isActive: { $ne: false } } }, // Only active employees
      {
        $group: {
          _id: { employeeRole: "$employeeRole", isActive: "$isActive" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format summary
    const stats = {
      milk_collector: { active: 0, inactive: 0, total: 0 },
      delivery_boy: { active: 0, inactive: 0, total: 0 },
      loan_feed_manager: { active: 0, inactive: 0, total: 0 },
      totals: { active: 0, inactive: 0, total: 0 }
    };

    summary.forEach(item => {
      const role = item._id.employeeRole;
      const status = item._id.isActive ? 'active' : 'inactive';
      
      if (stats[role]) {
        stats[role][status] = item.count;
        stats[role].total += item.count;
      }
      
      stats.totals[status] += item.count;
      stats.totals.total += item.count;
    });

    res.json({
      success: true,
      data: {
        employees,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        },
        summary: stats
      },
      message: "Employees retrieved successfully"
    });

  } catch (error) {
    console.error("Get employees error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: "Failed to retrieve employees"
      }
    });
  }
});

/**
 * Update employee details
 * PUT /api/admin/employees/:id
 */
export const updateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { username, email, address, employeeRole, isActive, education, salary } = req.body;

  // Find the employee
  const employee = await User.findOne({ _id: id, role: "employee" });
  
  if (!employee) {
    return res.status(404).json({
      success: false,
      error: {
        code: "EMPLOYEE_NOT_FOUND",
        message: "Employee not found"
      }
    });
  }

  // Validate employee role if provided
  if (employeeRole) {
    const validEmployeeRoles = ["milk_collector", "delivery_boy", "loan_feed_manager"];
    if (!validEmployeeRoles.includes(employeeRole)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_EMPLOYEE_ROLE",
          message: "Employee role must be one of: milk_collector, delivery_boy, loan_feed_manager"
        }
      });
    }
  }

  // Check for username conflicts if username is being changed
  if (username && username !== employee.username) {
    const existingUser = await User.findOne({ 
      username, 
      _id: { $ne: id } 
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
  }

  try {
    // Build update object
    const updateData = {};
    if (username) updateData.username = username;
    if (email !== undefined) updateData.email = email || undefined;
    if (address !== undefined) updateData.address = address || undefined;
    if (education !== undefined) updateData.education = education || undefined;
    if (salary !== undefined) updateData.salary = salary || undefined;
    if (employeeRole) updateData.employeeRole = employeeRole;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update employee
    const updatedEmployee = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).select('-password').populate('createdBy', 'username uniqueId');

    res.json({
      success: true,
      data: {
        employee: updatedEmployee
      },
      message: "Employee updated successfully"
    });

  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "UPDATE_FAILED",
        message: "Failed to update employee"
      }
    });
  }
});

/**
 * Reset employee password
 * POST /api/admin/employees/:id/reset-password
 */
export const resetEmployeePassword = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the employee
  const employee = await User.findOne({ _id: id, role: "employee" });
  
  if (!employee) {
    return res.status(404).json({
      success: false,
      error: {
        code: "EMPLOYEE_NOT_FOUND",
        message: "Employee not found"
      }
    });
  }

  try {
    // Generate new temporary password
    const newPassword = generateTemporaryPassword();
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update employee password and set reset required flag
    await User.findByIdAndUpdate(id, {
      password: hashedPassword,
      passwordResetRequired: true
    });

    res.json({
      success: true,
      data: {
        employeeId: id,
        username: employee.username,
        uniqueId: employee.uniqueId,
        newCredentials: {
          username: employee.username,
          password: newPassword
        }
      },
      message: "Password reset successfully. Please provide the new credentials to the employee."
    });

  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "RESET_FAILED",
        message: "Failed to reset employee password"
      }
    });
  }
});

/**
 * Toggle employee status (activate/deactivate)
 * PATCH /api/admin/employees/:id/toggle-status
 */
export const toggleEmployeeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the employee
  const employee = await User.findOne({ _id: id, role: "employee" });
  
  if (!employee) {
    return res.status(404).json({
      success: false,
      error: {
        code: "EMPLOYEE_NOT_FOUND",
        message: "Employee not found"
      }
    });
  }

  try {
    // Toggle the isActive status
    const newStatus = !employee.isActive;
    
    const updatedEmployee = await User.findByIdAndUpdate(
      id,
      { isActive: newStatus },
      { new: true }
    ).select('-password').populate('createdBy', 'username uniqueId');

    res.json({
      success: true,
      data: {
        employee: updatedEmployee,
        statusChanged: {
          from: employee.isActive,
          to: newStatus
        }
      },
      message: `Employee ${newStatus ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error("Toggle status error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "STATUS_TOGGLE_FAILED",
        message: "Failed to toggle employee status"
      }
    });
  }
});

/**
 * Get employee by ID with detailed information
 * GET /api/admin/employees/:id
 */
export const getEmployeeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const employee = await User.findOne({ _id: id, role: "employee" })
      .select('-password')
      .populate('createdBy', 'username uniqueId');

    if (!employee) {
      return res.status(404).json({
        success: false,
        error: {
          code: "EMPLOYEE_NOT_FOUND",
          message: "Employee not found"
        }
      });
    }

    // Get additional activity information (placeholder for future implementation)
    const activityInfo = {
      lastLogin: employee.lastLogin,
      totalLogins: 0, // To be implemented with login tracking
      accountAge: Math.floor((Date.now() - employee.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
      passwordResetRequired: employee.passwordResetRequired
    };

    res.json({
      success: true,
      data: {
        employee: {
          ...employee.toObject(),
          activityInfo
        }
      },
      message: "Employee details retrieved successfully"
    });

  } catch (error) {
    console.error("Get employee by ID error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "FETCH_FAILED",
        message: "Failed to retrieve employee details"
      }
    });
  }
});

/**
 * Delete employee (soft delete by deactivating)
 * DELETE /api/admin/employees/:id
 */
export const deleteEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the employee
  const employee = await User.findOne({ _id: id, role: "employee" });
  
  if (!employee) {
    return res.status(404).json({
      success: false,
      error: {
        code: "EMPLOYEE_NOT_FOUND",
        message: "Employee not found"
      }
    });
  }

  try {
    // Soft delete by deactivating the employee
    const deletedEmployee = await User.findByIdAndUpdate(
      id,
      { 
        isActive: false,
        deletedAt: new Date(),
        deletedBy: req.user.id
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      data: {
        employee: deletedEmployee
      },
      message: "Employee deleted successfully"
    });

  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "DELETE_FAILED",
        message: "Failed to delete employee"
      }
    });
  }
});

/**
 * Reactivate employee (undo soft delete)
 * PATCH /api/admin/employees/:id/reactivate
 */
export const reactivateEmployee = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find the employee
  const employee = await User.findOne({ _id: id, role: "employee" });
  
  if (!employee) {
    return res.status(404).json({
      success: false,
      error: {
        code: "EMPLOYEE_NOT_FOUND",
        message: "Employee not found"
      }
    });
  }

  try {
    // Reactivate the employee
    const reactivatedEmployee = await User.findByIdAndUpdate(
      id,
      { 
        isActive: true,
        deletedAt: null,
        deletedBy: null
      },
      { new: true }
    ).select('-password').populate('createdBy', 'username uniqueId');

    res.json({
      success: true,
      data: {
        employee: reactivatedEmployee
      },
      message: "Employee reactivated successfully"
    });

  } catch (error) {
    console.error("Reactivate employee error:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "REACTIVATE_FAILED",
        message: "Failed to reactivate employee"
      }
    });
  }
});

// Helper functions

/**
 * Generate unique credentials for employee
 */
async function generateEmployeeCredentials(baseName) {
  // Generate username based on base name
  let username = baseName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  // Ensure username is unique
  let counter = 1;
  let finalUsername = username;
  
  while (await User.findOne({ username: finalUsername })) {
    finalUsername = `${username}${counter}`;
    counter++;
  }

  // Generate secure temporary password
  const password = generateTemporaryPassword();

  return {
    username: finalUsername,
    password
  };
}

/**
 * Generate secure temporary password
 */
function generateTemporaryPassword() {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  
  // Ensure at least one character from each required type
  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)]; // Uppercase
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)]; // Lowercase
  password += "0123456789"[Math.floor(Math.random() * 10)]; // Number
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)]; // Special character
  
  // Fill remaining length with random characters
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password to randomize character positions
  return password.split('').sort(() => Math.random() - 0.5).join('');
}