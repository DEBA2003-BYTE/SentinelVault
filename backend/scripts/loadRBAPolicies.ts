import fs from 'fs';
import path from 'path';

const OPA_URL = process.env.OPA_URL || 'http://localhost:8181';

async function loadRBAPolicy() {
  try {
    console.log('🔄 Loading RBA Scoring Policy into OPA...');

    // Read the RBA scoring policy
    const policyPath = path.join(__dirname, '../policies/rba_scoring.rego');
    const policyContent = fs.readFileSync(policyPath, 'utf-8');

    // Load policy into OPA
    const response = await fetch(`${OPA_URL}/v1/policies/rba_scoring`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: policyContent,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to load policy: ${response.status} ${response.statusText}\n${errorText}`);
    }

    console.log('✅ RBA Scoring Policy loaded successfully');

    // Verify the policy is loaded
    const verifyResponse = await fetch(`${OPA_URL}/v1/policies/rba_scoring`);
    if (verifyResponse.ok) {
      console.log('✅ Policy verification successful');
    }

    // Test the policy with sample data
    await testRBAPolicy();

  } catch (error) {
    console.error('❌ Failed to load RBA policy:', error);
    console.log('\n💡 Make sure OPA is running:');
    console.log('   docker run -p 8181:8181 openpolicyagent/opa:latest run --server');
    process.exit(1);
  }
}

async function testRBAPolicy() {
  console.log('\n🧪 Testing RBA Policy...');

  const testCases = [
    {
      name: 'Low Risk - Normal Login',
      input: {
        failed_count: 0,
        gps: { lat: 28.6139, lon: 77.2090 },
        keystroke_sample: { meanIKI: 150 },
        timestamp: new Date().toISOString(),
        device_id: 'device123',
        user: {
          keystroke_baseline: { meanIKI: 150, stdIKI: 20, samples: 10 },
          location_history: [{ lat: 28.6139, lon: 77.2090, timestamp: new Date() }],
          known_devices: [{ deviceIdHash: 'device123', firstSeen: new Date(), lastSeen: new Date() }],
          activity_hours: { start: 8, end: 20, tz: 'Asia/Kolkata' },
          last_login_details: {
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            gps: { lat: 28.6139, lon: 77.2090 }
          }
        }
      },
      expectedRisk: 'low'
    },
    {
      name: 'Medium Risk - New Device',
      input: {
        failed_count: 0,
        gps: { lat: 28.6139, lon: 77.2090 },
        keystroke_sample: { meanIKI: 150 },
        timestamp: new Date().toISOString(),
        device_id: 'new_device',
        user: {
          keystroke_baseline: { meanIKI: 150, stdIKI: 20, samples: 10 },
          location_history: [{ lat: 28.6139, lon: 77.2090, timestamp: new Date() }],
          known_devices: [{ deviceIdHash: 'device123', firstSeen: new Date(), lastSeen: new Date() }],
          activity_hours: { start: 8, end: 20, tz: 'Asia/Kolkata' },
          last_login_details: {
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            gps: { lat: 28.6139, lon: 77.2090 }
          }
        }
      },
      expectedRisk: 'low' // Only 5 points for new device
    },
    {
      name: 'High Risk - Multiple Failed Attempts',
      input: {
        failed_count: 5,
        gps: { lat: 28.6139, lon: 77.2090 },
        keystroke_sample: { meanIKI: 150 },
        timestamp: new Date().toISOString(),
        device_id: 'device123',
        user: {
          keystroke_baseline: { meanIKI: 150, stdIKI: 20, samples: 10 },
          location_history: [{ lat: 28.6139, lon: 77.2090, timestamp: new Date() }],
          known_devices: [{ deviceIdHash: 'device123', firstSeen: new Date(), lastSeen: new Date() }],
          activity_hours: { start: 8, end: 20, tz: 'Asia/Kolkata' },
          last_login_details: {
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            gps: { lat: 28.6139, lon: 77.2090 }
          }
        }
      },
      expectedRisk: 'medium' // 50 points from failed attempts
    }
  ];

  for (const testCase of testCases) {
    try {
      const response = await fetch(`${OPA_URL}/v1/data/rba_scoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: testCase.input })
      });

      if (response.ok) {
        const result = await response.json();
        const riskScore = result.result.risk_score;
        const riskLevel = result.result.risk_level;
        const action = result.result.action;
        const breakdown = result.result.breakdown;

        console.log(`\n✅ ${testCase.name}`);
        console.log(`   Risk Score: ${riskScore}/100`);
        console.log(`   Risk Level: ${riskLevel}`);
        console.log(`   Action: ${action}`);
        console.log(`   Breakdown:`, JSON.stringify(breakdown, null, 2));

        if (riskLevel === testCase.expectedRisk) {
          console.log(`   ✓ Expected risk level matched`);
        } else {
          console.log(`   ⚠ Expected ${testCase.expectedRisk}, got ${riskLevel}`);
        }
      } else {
        console.error(`❌ ${testCase.name} - Failed:`, response.status);
      }
    } catch (error) {
      console.error(`❌ ${testCase.name} - Error:`, error);
    }
  }

  console.log('\n✅ RBA Policy testing complete\n');
}

// Run the script
loadRBAPolicy();
