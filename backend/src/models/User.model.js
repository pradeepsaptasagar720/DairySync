import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    uniqueId: {
      type: String,
      unique: true,
      sparse: true, // Allow null values and only enforce uniqueness on non-null values
      trim: true,
      uppercase: true,
      match: /^[FBEA]\d{6}$/
    },

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    education: {
      type: String,
      trim: true,
    },

    salary: {
      type: Number,
      min: 0,
    },

    mobile: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["admin", "farmer", "buyer", "employee"],
      required: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    approved: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Employee-specific fields for role-based access control
    employeeRole: {
      type: String,
      enum: ["milk_collector", "delivery_boy", "loan_feed_manager"],
      required: function() { 
        return this.role === "employee"; 
      },
      validate: {
        validator: function(value) {
          if (this.role === "employee") {
            return ["milk_collector", "delivery_boy", "loan_feed_manager"].includes(value);
          }
          return true;
        },
        message: "Employee role must be one of: milk_collector, delivery_boy, loan_feed_manager"
      }
    },

    // Employee account status - inactive by default until admin activates
    isActive: {
      type: Boolean,
      default: function() { 
        return this.role !== "employee"; 
      },
    },

    // Security tracking
    lastLogin: {
      type: Date,
    },

    // Force password change on first login for employees
    passwordResetRequired: {
      type: Boolean,
      default: function() { 
        return this.role === "employee"; 
      }
    },

    // Failed login attempt tracking for security
    failedLoginAttempts: {
      type: Number,
      default: 0,
      max: 10
    },

    // Account lockout timestamp
    accountLockedUntil: {
      type: Date,
    },

    deletedAt: {
      type: Date,
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // New fields for delivery person management
    availabilityStatus: {
      type: Boolean,
      default: false, // Default to unavailable
    },

    lastAvailabilityUpdate: {
      type: Date,
      default: null,
    },

    // Cached performance metrics (updated on each order completion)
    deliveryStats: {
      totalDeliveries: { type: Number, default: 0 },
      totalAccepted: { type: Number, default: 0 },
      totalOffered: { type: Number, default: 0 },
      averageRating: { type: Number, default: 0, min: 0, max: 5 },
      totalRatings: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Index for efficient searching by uniqueId
userSchema.index({ uniqueId: 1 });

// Indexes for efficient employee queries
userSchema.index({ role: 1, employeeRole: 1 });
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ createdBy: 1 });
userSchema.index({ lastLogin: -1 });
userSchema.index({ failedLoginAttempts: 1, accountLockedUntil: 1 });

// Virtual for checking if account is locked
userSchema.virtual('isAccountLocked').get(function() {
  return !!(this.accountLockedUntil && this.accountLockedUntil > Date.now());
});

// Role-based access control methods
userSchema.methods.canAccessPage = function(pageName) {
  if (this.role !== "employee" || !this.isActive) {
    return false;
  }

  const rolePermissions = {
    milk_collector: {
      allowedPages: [
        'milk-collection', 'manage-farmers', 
        'manage-buyers', 'generate-reports', 'payment-status', 
        'dairy-time', 'transported-milk', 'animal-info'
      ],
      viewOnlyPages: [] // No view-only pages
    },
    delivery_boy: {
      allowedPages: ['delivery-requests'],
      viewOnlyPages: []
    },
    loan_feed_manager: {
      allowedPages: ['loan-management', 'feed-management', 'loan-feed-management', 'feed-stock-management'],
      viewOnlyPages: []
    }
  };

  const permissions = rolePermissions[this.employeeRole];
  return permissions ? permissions.allowedPages.includes(pageName) : false;
};

userSchema.methods.canModifyPage = function(pageName) {
  if (this.role !== "employee" || !this.isActive) {
    return false;
  }

  const rolePermissions = {
    milk_collector: {
      viewOnlyPages: [] // No view-only pages
    },
    delivery_boy: {
      viewOnlyPages: []
    },
    loan_feed_manager: {
      viewOnlyPages: []
    }
  };

  const permissions = rolePermissions[this.employeeRole];
  if (!permissions) return false;

  // If page is in view-only list, cannot modify
  return !permissions.viewOnlyPages.includes(pageName);
};

userSchema.methods.getRedirectPath = function() {
  if (this.role !== "employee" || !this.isActive) {
    return "/employee";
  }

  const redirectPaths = {
    milk_collector: "/employee",
    delivery_boy: "/delivery", 
    loan_feed_manager: "/loanfeed"
  };

  return redirectPaths[this.employeeRole] || "/employee";
};

userSchema.methods.getAllowedPages = function() {
  if (this.role !== "employee" || !this.isActive) {
    return [];
  }

  const rolePermissions = {
    milk_collector: [
      'milk-collection', 'manage-farmers', 
      'manage-buyers', 'generate-reports', 'payment-status', 
      'dairy-time', 'transported-milk', 'animal-info'
    ],
    delivery_boy: ['delivery-requests'],
    loan_feed_manager: ['loan-management', 'feed-management', 'loan-feed-management', 'feed-stock-management']
  };

  return rolePermissions[this.employeeRole] || [];
};

// Security methods
userSchema.methods.incrementFailedLogin = function() {
  this.failedLoginAttempts += 1;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.failedLoginAttempts >= 5) {
    this.accountLockedUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
  }
  
  return this.save();
};

userSchema.methods.resetFailedLogin = function() {
  this.failedLoginAttempts = 0;
  this.accountLockedUntil = undefined;
  return this.save();
};

export default mongoose.model("User", userSchema);
