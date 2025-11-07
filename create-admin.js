const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './backend/.env' });

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

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Debarghya';

    console.log(`👤 Creating admin user: ${adminEmail}`);

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists');
      
      // Update password if needed
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.isAdmin = true;
      existingAdmin.isBlocked = false;
      await existingAdmin.save();
      
      console.log('✅ Admin user updated with new password');
    } else {
      // Create new admin user
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      
      const adminUser = new User({
        email: adminEmail,
        passwordHash,
        isAdmin: true,
        isBlocked: false,
        deviceFingerprint: 'admin-device-fingerprint',
        registeredLocation: 'Admin Location',
        lastKnownLocation: 'Admin Location'
      });

      await adminUser.save();
      console.log('✅ Admin user created successfully');
    }

    // Create a test user as well
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
        deviceFingerprint: 'test-device-fingerprint',
        registeredLocation: 'Test Location',
        lastKnownLocation: 'Test Location'
      });

      await testUser.save();
      console.log('✅ Test user created successfully');
    }

    console.log('');
    console.log('🎉 User setup complete!');
    console.log('👤 Admin Login:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('');
    console.log('👤 Test User Login:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);

    await mongoose.disconnect();
    console.log('✅ Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser();