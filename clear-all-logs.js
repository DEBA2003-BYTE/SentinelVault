// Script to clear all logs from the database
const mongoose = require('mongoose');
require('dotenv').config();

async function clearAllLogs() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sentinelvault';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections found:', collections.map(c => c.name).join(', '));

    // Clear AccessLogs
    try {
      const AccessLog = mongoose.connection.collection('accesslogs');
      const accessCount = await AccessLog.countDocuments();
      if (accessCount > 0) {
        await AccessLog.deleteMany({});
        console.log(`✅ Deleted ${accessCount} access logs`);
      } else {
        console.log('ℹ️  No access logs to delete');
      }
    } catch (e) {
      console.log('ℹ️  AccessLogs collection not found or empty');
    }

    // Clear RiskEvents
    try {
      const RiskEvent = mongoose.connection.collection('riskevents');
      const riskCount = await RiskEvent.countDocuments();
      if (riskCount > 0) {
        await RiskEvent.deleteMany({});
        console.log(`✅ Deleted ${riskCount} risk events`);
      } else {
        console.log('ℹ️  No risk events to delete');
      }
    } catch (e) {
      console.log('ℹ️  RiskEvents collection not found or empty');
    }

    // Clear FailedLoginAttempts
    try {
      const FailedAttempt = mongoose.connection.collection('failedloginattempts');
      const failedCount = await FailedAttempt.countDocuments();
      if (failedCount > 0) {
        await FailedAttempt.deleteMany({});
        console.log(`✅ Deleted ${failedCount} failed login attempts`);
      } else {
        console.log('ℹ️  No failed login attempts to delete');
      }
    } catch (e) {
      console.log('ℹ️  FailedLoginAttempts collection not found or empty');
    }

    console.log('\n✅ All logs cleared successfully!');
    console.log('Now login again to see fresh logs with proper GPS location.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing logs:', error);
    process.exit(1);
  }
}

clearAllLogs();
