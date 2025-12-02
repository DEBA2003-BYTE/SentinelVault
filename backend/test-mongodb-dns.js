#!/usr/bin/env node

/**
 * MongoDB Atlas DNS Troubleshooting Script
 * Run this to diagnose DNS issues: node test-mongodb-dns.js
 */

const dns = require('dns');
const https = require('https');

console.log('🔍 Testing MongoDB Atlas DNS Resolution...\n');

// Test 1: DNS SRV Resolution
console.log('Test 1: DNS SRV Record Resolution');
dns.resolveSrv('_mongodb._tcp.cluster0.ly05itn.mongodb.net', (err, addresses) => {
  if (err) {
    console.log('❌ DNS SRV Resolution Failed');
    console.log('   Error:', err.code);
    console.log('\n💡 Possible Solutions:');
    console.log('   1. Check your internet connection');
    console.log('   2. Try a different DNS server (e.g., Google DNS 8.8.8.8)');
    console.log('   3. Disable VPN if active');
    console.log('   4. Check firewall settings');
    console.log('   5. Try from a different network (mobile hotspot)');
    console.log('\n📝 To change DNS on macOS:');
    console.log('   System Preferences → Network → Advanced → DNS');
    console.log('   Add: 8.8.8.8 and 8.8.4.4 (Google DNS)');
  } else {
    console.log('✅ DNS SRV Resolution Successful');
    console.log('   Found', addresses.length, 'MongoDB servers:');
    addresses.forEach((addr, i) => {
      console.log(`   ${i + 1}. ${addr.name}:${addr.port} (priority: ${addr.priority})`);
    });
  }
  
  // Test 2: Internet Connectivity
  console.log('\nTest 2: Internet Connectivity');
  https.get('https://www.google.com', (res) => {
    console.log('✅ Internet connection is working');
    console.log('   Status:', res.statusCode);
  }).on('error', (err) => {
    console.log('❌ Internet connection issue');
    console.log('   Error:', err.message);
  });
  
  // Test 3: MongoDB Atlas Reachability
  console.log('\nTest 3: MongoDB Atlas API Reachability');
  https.get('https://cloud.mongodb.com', (res) => {
    console.log('✅ MongoDB Atlas is reachable');
    console.log('   Status:', res.statusCode);
  }).on('error', (err) => {
    console.log('❌ Cannot reach MongoDB Atlas');
    console.log('   Error:', err.message);
  });
});

// Test 4: Check current DNS servers
console.log('\nTest 4: Current DNS Configuration');
dns.getServers().forEach((server, i) => {
  console.log(`   DNS Server ${i + 1}: ${server}`);
});

console.log('\n' + '='.repeat(60));
console.log('If DNS resolution fails, try these commands:\n');
console.log('# Flush DNS cache (macOS):');
console.log('sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder\n');
console.log('# Test with Google DNS:');
console.log('dig @8.8.8.8 _mongodb._tcp.cluster0.ly05itn.mongodb.net SRV\n');
console.log('# Or use standard connection string instead of SRV:');
console.log('# Get it from MongoDB Atlas → Connect → Drivers → Standard connection');
console.log('='.repeat(60));
