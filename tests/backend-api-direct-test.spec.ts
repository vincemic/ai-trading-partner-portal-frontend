import { test, expect } from '@playwright/test';

test.describe('Backend API Direct Query Parameter Test', () => {
  test('should verify backend API is running and supports query parameter auth', async ({ request }) => {
    const baseUrl = 'https://localhost:7096';
    
    console.log('\n=== BACKEND API VERIFICATION ===');

    // Test 1: Health endpoint (no auth required)
    try {
      console.log('1. Testing health endpoint...');
      const healthResponse = await request.get(`${baseUrl}/api/health`, {
        ignoreHTTPSErrors: true
      });
      console.log(`   Health status: ${healthResponse.status()}`);
      
      if (healthResponse.ok()) {
        const healthData = await healthResponse.json();
        console.log(`   Health data:`, healthData);
      }
    } catch (error) {
      console.log(`   Health endpoint error: ${error}`);
    }

    // Test 2: Version endpoint (no auth required)
    try {
      console.log('2. Testing version endpoint...');
      const versionResponse = await request.get(`${baseUrl}/api/version`, {
        ignoreHTTPSErrors: true
      });
      console.log(`   Version status: ${versionResponse.status()}`);
      
      if (versionResponse.ok()) {
        const versionData = await versionResponse.json();
        console.log(`   Version data:`, versionData);
      }
    } catch (error) {
      console.log(`   Version endpoint error: ${error}`);
    }

    // Test 3: Dashboard endpoint with header auth
    try {
      console.log('3. Testing dashboard with header auth...');
      const dashboardResponse = await request.get(`${baseUrl}/api/dashboard/summary`, {
        headers: {
          'X-Session-Token': 'admin-session-token'
        },
        ignoreHTTPSErrors: true
      });
      console.log(`   Dashboard (header auth) status: ${dashboardResponse.status()}`);
    } catch (error) {
      console.log(`   Dashboard header auth error: ${error}`);
    }

    // Test 4: Dashboard endpoint with query parameter auth (if supported)
    try {
      console.log('4. Testing dashboard with query parameter auth...');
      const dashboardQueryResponse = await request.get(`${baseUrl}/api/dashboard/summary?token=admin-session-token`, {
        ignoreHTTPSErrors: true
      });
      console.log(`   Dashboard (query auth) status: ${dashboardQueryResponse.status()}`);
    } catch (error) {
      console.log(`   Dashboard query auth error: ${error}`);
    }

    console.log('================================\n');
  });

  test('should test SSE endpoint directly with various authentication methods', async ({ request }) => {
    const baseUrl = 'https://localhost:7096';
    
    console.log('\n=== SSE ENDPOINT DIRECT TEST ===');

    // Test 1: SSE with header authentication
    try {
      console.log('1. Testing SSE with X-Session-Token header...');
      const sseHeaderResponse = await request.get(`${baseUrl}/api/events/stream`, {
        headers: {
          'X-Session-Token': 'admin-session-token',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        ignoreHTTPSErrors: true,
        timeout: 5000
      });
      console.log(`   SSE (header auth) status: ${sseHeaderResponse.status()}`);
      console.log(`   SSE (header auth) headers:`, sseHeaderResponse.headers());
      
      // Read a small portion of the response to see if it's an event stream
      if (sseHeaderResponse.ok()) {
        const responseText = await sseHeaderResponse.text();
        console.log(`   SSE response sample (first 200 chars): ${responseText.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`   SSE header auth error: ${error}`);
    }

    // Test 2: SSE with query parameter authentication
    try {
      console.log('2. Testing SSE with query parameter token...');
      const sseQueryResponse = await request.get(`${baseUrl}/api/events/stream?token=admin-session-token`, {
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        ignoreHTTPSErrors: true,
        timeout: 5000
      });
      console.log(`   SSE (query auth) status: ${sseQueryResponse.status()}`);
      console.log(`   SSE (query auth) headers:`, sseQueryResponse.headers());
      
      // Read a small portion of the response to see if it's an event stream
      if (sseQueryResponse.ok()) {
        const responseText = await sseQueryResponse.text();
        console.log(`   SSE response sample (first 200 chars): ${responseText.substring(0, 200)}`);
      }
    } catch (error) {
      console.log(`   SSE query auth error: ${error}`);
    }

    // Test 3: SSE with no authentication (should fail)
    try {
      console.log('3. Testing SSE with no authentication...');
      const sseNoAuthResponse = await request.get(`${baseUrl}/api/events/stream`, {
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        ignoreHTTPSErrors: true,
        timeout: 5000
      });
      console.log(`   SSE (no auth) status: ${sseNoAuthResponse.status()}`);
    } catch (error) {
      console.log(`   SSE no auth error: ${error}`);
    }

    // Test 4: SSE with invalid token via query parameter
    try {
      console.log('4. Testing SSE with invalid query parameter token...');
      const sseInvalidResponse = await request.get(`${baseUrl}/api/events/stream?token=invalid-token-123`, {
        headers: {
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        ignoreHTTPSErrors: true,
        timeout: 5000
      });
      console.log(`   SSE (invalid token) status: ${sseInvalidResponse.status()}`);
    } catch (error) {
      console.log(`   SSE invalid token error: ${error}`);
    }

    // Test 5: Test all predefined token types
    const predefinedTokens = [
      'admin-session-token',
      'user-session-token', 
      'test-session-token',
      'test-admin-user1',
      'test-user-john'
    ];

    console.log('5. Testing all predefined tokens via query parameter...');
    for (const token of predefinedTokens) {
      try {
        const response = await request.get(`${baseUrl}/api/events/stream?token=${token}`, {
          headers: {
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
          },
          ignoreHTTPSErrors: true,
          timeout: 3000
        });
        console.log(`   Token "${token}": Status ${response.status()}`);
      } catch (error) {
        console.log(`   Token "${token}": Error - ${error}`);
      }
    }

    console.log('================================\n');
  });
});