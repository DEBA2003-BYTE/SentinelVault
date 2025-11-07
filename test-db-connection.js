const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

async function testConnection() {
  console.log('🔍 Testing MongoDB Connection...');
  console.log('Connection String:', process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@'));
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      bufferCommands: true,

    });
    
    console.log('✅ MongoDB connection successful!');
    
    // Test ping
    await mongoose.connection.db.admin().ping();
    console.log('✅ MongoDB ping successful!');
    
    // Test basic operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✅ Database accessible - ${collections.length} collections found`);
    
    await mongoose.disconnect();
    console.log('✅ Connection test completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('💡 Possible solutions:');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify MongoDB Atlas IP whitelist');
    console.log('   3. Confirm username/password in connection string');
    console.log('   4. Try the fallback connection string in .env');
    process.exit(1);
  }
}

testConnection();