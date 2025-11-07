// Test login functionality
async function testLogin() {
  const loginData = {
    email: 'admin@gmail.com',
    password: 'Debarghya',
    deviceFingerprint: 'test-device-fingerprint',
    location: 'Test Location'
  };

  try {
    console.log('🧪 Testing admin login...');
    console.log('Credentials:', { email: loginData.email, password: '***' });
    
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(loginData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('User:', {
        id: result.user.id,
        email: result.user.email,
        isAdmin: result.user.isAdmin
      });
      console.log('Token received:', result.token ? 'Yes' : 'No');
    } else {
      console.log('❌ Login failed:', result.error || result.message);
      console.log('Response status:', response.status);
      console.log('Full response:', result);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Test registration as well
async function testRegistration() {
  const registerData = {
    email: 'newuser@example.com',
    password: 'testpassword123',
    deviceFingerprint: 'test-device-fingerprint',
    location: 'Test Location'
  };

  try {
    console.log('🧪 Testing user registration...');
    
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Registration successful!');
      console.log('User:', {
        id: result.user.id,
        email: result.user.email,
        isAdmin: result.user.isAdmin
      });
    } else {
      console.log('❌ Registration failed:', result.error || result.message);
    }
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

// Run tests
console.log('🚀 Starting authentication tests...');
console.log('====================================');

setTimeout(async () => {
  await testLogin();
  console.log('');
  await testRegistration();
}, 1000);