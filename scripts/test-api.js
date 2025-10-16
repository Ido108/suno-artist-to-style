#!/usr/bin/env node

/**
 * Test script to verify API is working
 * Usage: node scripts/test-api.js <API_URL>
 */

const API_URL = process.argv[2] || 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing Suno Artist API...\n');
  console.log(`API URL: ${API_URL}\n`);

  try {
    // Test 1: Health check
    console.log('Test 1: Health Check');
    const healthResponse = await fetch(`${API_URL}/health`);
    const health = await healthResponse.json();
    console.log('✅ Health:', health);
    console.log('');

    // Test 2: Get all artists
    console.log('Test 2: Get All Artists');
    const artistsResponse = await fetch(`${API_URL}/api/artists`);
    const artistsData = await artistsResponse.json();
    console.log('✅ Artists loaded:', Object.keys(artistsData.artists).length);
    console.log('   Enabled:', artistsData.enabled);
    console.log('');

    // Test 3: Get specific artist
    console.log('Test 3: Get Specific Artist (Billy Joel)');
    const artistResponse = await fetch(`${API_URL}/api/artists/Billy%20Joel`);
    const artist = await artistResponse.json();
    console.log('✅ Artist:', artist);
    console.log('');

    // Test 4: Add artist (will fail without password, expected)
    console.log('Test 4: Add Artist (should fail - no password)');
    const addResponse = await fetch(`${API_URL}/api/artists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Artist',
        style: 'Test Style'
      })
    });
    const addResult = await addResponse.json();
    console.log(addResponse.ok ? '❌ Unexpected success' : '✅ Expected failure:', addResult);
    console.log('');

    console.log('🎉 All tests completed!');
    console.log('\nTo test with authentication:');
    console.log(`ADMIN_PASSWORD=your_password node scripts/test-api.js ${API_URL}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testAPI();
