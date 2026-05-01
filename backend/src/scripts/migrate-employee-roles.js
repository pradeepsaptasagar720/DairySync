import mongoose from 'mongoose';
import User from '../models/User.model.js';
import { env } from '../config/env.js';

/**
 * Migration script to update existing employee records with new role-based fields
 * This script ensures all existing employees have proper role assignments and security settings
 */

async function migrateEmployeeRoles() {
  try {
    console.log('🔄 Starting employee role migration...');
    
    // Connect to database
    await mongoose.connect(env.MONGO_URI);
    console.log('✅ Connected to database');

    // Find all existing employee users
    const employees = await User.find({ role: 'employee' });
    console.log(`📊 Found ${employees.length} employee records to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const employee of employees) {
      const updates = {};
      let needsUpdate = false;

      // Set default employee role if not assigned
      if (!employee.employeeRole) {
        updates.employeeRole = 'milk_collector'; // Default to milk collector
        needsUpdate = true;
        console.log(`🔧 Setting default role for employee: ${employee.username}`);
      }

      // Ensure isActive field is set (default to false for security)
      if (employee.isActive === undefined || employee.isActive === null) {
        updates.isActive = false; // Require admin activation
        needsUpdate = true;
        console.log(`🔒 Setting inactive status for employee: ${employee.username}`);
      }

      // Set password reset requirement for first login
      if (employee.passwordResetRequired === undefined || employee.passwordResetRequired === null) {
        updates.passwordResetRequired = true;
        needsUpdate = true;
        console.log(`🔑 Requiring password reset for employee: ${employee.username}`);
      }

      // Initialize security fields
      if (employee.failedLoginAttempts === undefined || employee.failedLoginAttempts === null) {
        updates.failedLoginAttempts = 0;
        needsUpdate = true;
      }

      // Apply updates if needed
      if (needsUpdate) {
        await User.findByIdAndUpdate(employee._id, updates);
        migratedCount++;
        console.log(`✅ Migrated employee: ${employee.username} (${employee.mobile})`);
      } else {
        skippedCount++;
        console.log(`⏭️  Skipped employee: ${employee.username} (already up to date)`);
      }
    }

    console.log('\n📈 Migration Summary:');
    console.log(`✅ Migrated: ${migratedCount} employees`);
    console.log(`⏭️  Skipped: ${skippedCount} employees`);
    console.log(`📊 Total: ${employees.length} employees processed`);

    // Verify migration results
    const verifyEmployees = await User.find({ 
      role: 'employee',
      $or: [
        { employeeRole: { $exists: false } },
        { isActive: { $exists: false } },
        { passwordResetRequired: { $exists: false } },
        { failedLoginAttempts: { $exists: false } }
      ]
    });

    if (verifyEmployees.length === 0) {
      console.log('✅ Migration verification passed - all employees have required fields');
    } else {
      console.log(`⚠️  Migration verification failed - ${verifyEmployees.length} employees still missing fields`);
      verifyEmployees.forEach(emp => {
        console.log(`   - ${emp.username}: missing fields`);
      });
    }

    console.log('🎉 Employee role migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateEmployeeRoles()
    .then(() => {
      console.log('✅ Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

export default migrateEmployeeRoles;