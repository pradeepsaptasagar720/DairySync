import mongoose from "mongoose";
import User from "../models/User.model.js";
import { env } from "../config/env.js";

/**
 * Migration script to update employee roles for role-based authentication system
 * This script migrates existing employee roles to the new role system:
 * - milk_collection -> milk_collector
 * - milk_delivery -> delivery_boy  
 * - general -> milk_collector (default fallback)
 */

async function migrateEmployeeFields() {
  try {
    console.log("🔄 Starting employee role-based authentication migration...");
    
    // Connect to database
    await mongoose.connect(env.MONGODB_URI);
    console.log("✅ Connected to database");

    // Find all existing employee users
    const existingEmployees = await User.find({ 
      role: "employee"
    });

    console.log(`📊 Found ${existingEmployees.length} employee users to migrate`);

    let migratedCount = 0;
    const migrationResults = [];

    for (const employee of existingEmployees) {
      try {
        const updateData = {};
        
        // Migrate employeeRole to new role system
        if (employee.employeeRole) {
          switch (employee.employeeRole) {
            case "milk_collection":
              updateData.employeeRole = "milk_collector";
              break;
            case "milk_delivery":
              updateData.employeeRole = "delivery_boy";
              break;
            case "general":
            default:
              updateData.employeeRole = "milk_collector"; // Default fallback
              break;
          }
        } else {
          // Set default role for employees without a role
          updateData.employeeRole = "milk_collector";
        }
        
        // Ensure isActive is set
        if (employee.isActive === undefined) {
          updateData.isActive = true;
        }
        
        // Ensure passwordResetRequired is set for employees
        if (employee.passwordResetRequired === undefined) {
          updateData.passwordResetRequired = true;
        }

        // Update the employee record
        await User.updateOne({ _id: employee._id }, { $set: updateData });
        
        migrationResults.push({
          userId: employee._id,
          username: employee.username,
          uniqueId: employee.uniqueId,
          oldRole: employee.employeeRole,
          newRole: updateData.employeeRole,
          updatedFields: Object.keys(updateData)
        });
        
        migratedCount++;
        console.log(`✅ Migrated employee: ${employee.username} (${employee.uniqueId || 'No ID'}) - ${employee.employeeRole || 'undefined'} -> ${updateData.employeeRole}`);
        
      } catch (error) {
        console.error(`❌ Failed to migrate employee ${employee._id}:`, error.message);
        migrationResults.push({
          userId: employee._id,
          username: employee.username,
          error: error.message
        });
      }
    }

    console.log("\n📋 Migration Summary:");
    console.log(`✅ Successfully migrated: ${migratedCount} employees`);
    console.log(`❌ Failed migrations: ${existingEmployees.length - migratedCount}`);
    
    if (migrationResults.length > 0) {
      console.log("\n📄 Detailed Results:");
      migrationResults.forEach(result => {
        if (result.error) {
          console.log(`❌ ${result.username}: ${result.error}`);
        } else {
          console.log(`✅ ${result.username}: ${result.oldRole || 'undefined'} -> ${result.newRole}`);
        }
      });
    }

    console.log("\n🎉 Employee role-based authentication migration completed!");
    
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from database");
    process.exit(0);
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateEmployeeFields();
}

export default migrateEmployeeFields;