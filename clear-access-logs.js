// Script to clear all access logs from the database
const mongoose = require('mongoose');
require('dotenv').config();

const AccessLogSchema = new mongoose.Schema({}, { strict: false, collection: 'accesslogs' });
const AccessLog = mongoose.model('AccessLog', AccessLogSchema);

async function clearAccessLogs() {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sentinelvault';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Count existing logs
    const count = await AccessLog.countDocuments();
    console.log(`Found ${count} access logs`);

    // Delete all access logs
    const result = await AccessLog.deleteMany({});
    console.log(`Deleted ${result.deletedCount} access logs`);

    console.log('✅ All access logs cleared successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing access logs:', error);
    process.exit(1);
  }
}

clearAccessLogs();
