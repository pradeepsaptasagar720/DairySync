import mongoose from 'mongoose';

const userNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  notification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    required: true
  },
  
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  
  readAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
userNotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
userNotificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('UserNotification', userNotificationSchema);
