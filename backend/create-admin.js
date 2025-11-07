import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// User schema (simplified for this script)
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  deviceFingerprint: String,
  registeredLocation: String,
  lastKnownLocation: String,
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date
});

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      bufferCommands: true,
    });
    
    console.log('✅ Connected to MongoDB');

    // Use exact credentials from .env file
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'Debarghya';

    console.log(`👤 Creating admin user: ${adminEmail}`);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists, updating...');
      
      // Update password and ensure admin status
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.isAdmin = true;
      existingAdmin.isBlocked = false;
      await existingAdmin.save();
      
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new admin user
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      
      const adminUser = new User({
        email: adminEmail,
        passwordHash,
        isAdmin: true,
        isBlocked: false,
        deviceFingerprint: 'admin-device-default',
        registeredLocation: 'Admin Default Location',
        lastKnownLocation: 'Admin Default Location'
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully');
    }

    // Also create a test user for demo
    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    
    const existingTest = await User.findOne({ email: testEmail });
    if (!existingTest) {
      const testPasswordHash = await bcrypt.hash(testPassword, 12);
      
      const testUser = new User({
        email: testEmail,
        passwordHash: testPasswordHash,
        isAdmin: false,
        isBlocked: false,
        deviceFingerprint: 'test-device-default',
        registeredLocation: 'Test Default Location',
        lastKnownLocation: 'Test Default Location'
      });

      await testUser.save();
      console.log('✅ Test user created successfully');
    }

    console.log('');
    console.log('🎉 USER SETUP COMPLETE!');
    console.log('========================');
    console.log('👤 Admin Login Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('');
    console.log('👤 Test User Credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    console.log('');
    console.log('🚀 You can now login with these credentials!');

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

createAdminUser();