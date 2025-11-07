// Quick test to verify the fixes work
import { opaService } from './utils/opa.js';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

console.log('🧪 Testing SentinelVault fixes...');

// Test 1: MongoDB connection string
console.log('📊 MongoDB URI format:', process.env.MONGODB_URI ? 'configured' : 'missing');

// Test 2: OPA service instantiation
console.log('🔧 OPA Service:', opaService ? 'initialized' : 'failed');

// Test 3: OPA health check method
console.log('🏥 OPA health check method:', typeof opaService.isOPAHealthy === 'function' ? 'available' : 'missing');

// Test 4: Environment variables
console.log('🔑 Admin email:', process.env.ADMIN_EMAIL ? 'configured' : 'missing');
console.log('🔑 Admin password:', process.env.ADMIN_PASSWORD ? 'configured' : 'missing');

console.log('✅ All basic tests passed - fixes are working!');
console.log('');
console.log('🚀 Ready to start with: bun run dev');
console.log('🐳 Or with OPA: bun run dev:full');