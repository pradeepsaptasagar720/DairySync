import cron from 'node-cron';
import { processScheduledNotifications } from './notification.service.js';

// Run every minute to check for scheduled notifications
const notificationScheduler = cron.schedule('* * * * *', async () => {
  try {
    console.log('🔔 Checking for scheduled notifications...');
    const results = await processScheduledNotifications();
    
    if (results.length > 0) {
      console.log(`📱 Processed ${results.length} scheduled notifications`);
      results.forEach(result => {
        console.log(`  - ${result.type}: ${result.result.length} recipients`);
      });
    }
  } catch (error) {
    console.error('❌ Error in notification scheduler:', error);
  }
}, {
  scheduled: false // Don't start automatically
});

// Start the scheduler
export const startNotificationScheduler = () => {
  notificationScheduler.start();
  console.log('🚀 Notification scheduler started');
};

// Stop the scheduler
export const stopNotificationScheduler = () => {
  notificationScheduler.stop();
  console.log('🛑 Notification scheduler stopped');
};

export default {
  startNotificationScheduler,
  stopNotificationScheduler
};