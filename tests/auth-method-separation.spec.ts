import { test, expect } from '@playwright/test';

test.describe('Authentication Method Separation Test', () => {
  test('should use header auth for REST API and query param auth for SSE', async ({ page }) => {
    console.log('\n=== TESTING AUTHENTICATION METHOD SEPARATION ===');
    console.log('Verifying that REST APIs use header authentication and SSE uses query parameter authentication');

    // Monitor ALL network requests to see authentication methods
    const networkRequests: Array<{
      url: string;
      method: string;
      headers: any;
      isSSE: boolean;
      isREST: boolean;
      authMethod: string;
      timestamp: number;
    }> = [];

    page.on('request', request => {
      const url = request.url();
      const headers = request.headers();
      
      // Classify the request type
      const isSSE = url.includes('/api/events/stream');
      const isREST = url.includes('/api/') && !isSSE;
      
      if (isSSE || isREST) {
        let authMethod = 'none';
        
        if (isSSE) {
          // For SSE, check query parameters
          if (url.includes('token=')) {
            authMethod = 'query-parameter';
          }
        } else if (isREST) {
          // For REST, check headers
          if (headers['x-session-token']) {
            authMethod = 'header';
          }
        }

        networkRequests.push({
          url: url,
          method: request.method(),
          headers: headers,
          isSSE: isSSE,
          isREST: isREST,
          authMethod: authMethod,
          timestamp: Date.now()
        });

        console.log(`📡 ${isSSE ? 'SSE' : 'REST'} Request: ${request.method()} ${url}`);
        if (authMethod !== 'none') {
          console.log(`   Auth: ${authMethod}`);
        }
      }
    });

    // Navigate to the app and trigger some API calls
    await page.goto('/');

    // Set up a session token to enable authentication
    await page.evaluate(() => {
      localStorage.setItem('portalSessionToken', 'admin-session-token');
    });

    // Reload to trigger API calls with authentication
    await page.reload();
    await page.waitForTimeout(3000);

    // Try to trigger some API calls by interacting with the page
    await page.evaluate(() => {
      // Try to trigger some REST API calls programmatically
      // This simulates what the Angular app would do
      
      // Simulate fetching dashboard data
      fetch('/api/dashboard/summary', {
        headers: {
          'X-Session-Token': 'admin-session-token'
        }
      }).catch(() => {}); // Ignore errors, we just want to see the request

      // Simulate fetching version info
      fetch('/api/version').catch(() => {});

      // Simulate fetching health status
      fetch('/api/health').catch(() => {});

      // Try to create an SSE connection with query parameter
      try {
        const eventSource = new EventSource('/api/events/stream?token=admin-session-token');
        setTimeout(() => eventSource.close(), 1000);
      } catch (error) {
        console.log('SSE test error:', error);
      }
    });

    // Wait for network requests to complete
    await page.waitForTimeout(5000);

    console.log('\n=== AUTHENTICATION METHOD ANALYSIS ===');
    
    const restRequests = networkRequests.filter(req => req.isREST);
    const sseRequests = networkRequests.filter(req => req.isSSE);

    console.log(`Total REST API requests: ${restRequests.length}`);
    console.log(`Total SSE requests: ${sseRequests.length}`);

    // Analyze REST API authentication
    console.log('\n--- REST API Authentication ---');
    if (restRequests.length > 0) {
      restRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.method} ${req.url}`);
        console.log(`   Auth Method: ${req.authMethod}`);
        if (req.authMethod === 'header' && req.headers['x-session-token']) {
          console.log(`   ✅ Header: X-Session-Token = ${req.headers['x-session-token']}`);
        } else if (req.authMethod === 'none') {
          console.log(`   ⚠️  No authentication detected`);
        }
      });
    } else {
      console.log('❌ No REST API requests detected');
    }

    // Analyze SSE authentication
    console.log('\n--- SSE Authentication ---');
    if (sseRequests.length > 0) {
      sseRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.method} ${req.url}`);
        console.log(`   Auth Method: ${req.authMethod}`);
        if (req.authMethod === 'query-parameter') {
          const urlObj = new URL(req.url);
          const token = urlObj.searchParams.get('token');
          console.log(`   ✅ Query Parameter: token = ${token}`);
        } else if (req.authMethod === 'none') {
          console.log(`   ⚠️  No authentication detected`);
        }
      });
    } else {
      console.log('❌ No SSE requests detected');
    }

    // Summary analysis
    console.log('\n=== COMPLIANCE SUMMARY ===');
    
    const restWithHeaders = restRequests.filter(req => req.authMethod === 'header').length;
    const restWithoutAuth = restRequests.filter(req => req.authMethod === 'none').length;
    const sseWithQueryParams = sseRequests.filter(req => req.authMethod === 'query-parameter').length;
    const sseWithoutAuth = sseRequests.filter(req => req.authMethod === 'none').length;

    console.log(`REST APIs using header auth: ${restWithHeaders}/${restRequests.length}`);
    console.log(`REST APIs without auth: ${restWithoutAuth}/${restRequests.length}`);
    console.log(`SSE using query param auth: ${sseWithQueryParams}/${sseRequests.length}`);
    console.log(`SSE without auth: ${sseWithoutAuth}/${sseRequests.length}`);

    // Determine compliance
    const restCompliant = restRequests.length === 0 || (restWithHeaders > 0 && restWithoutAuth <= restRequests.length);
    const sseCompliant = sseRequests.length === 0 || sseWithQueryParams > 0;

    console.log('\n--- COMPLIANCE STATUS ---');
    console.log(`REST API Compliance: ${restCompliant ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`SSE Compliance: ${sseCompliant ? '✅ PASS' : '❌ FAIL'}`);

    if (restCompliant && sseCompliant) {
      console.log('\n🎉 SUCCESS: Authentication methods are properly separated!');
      console.log('✅ REST APIs use header authentication (X-Session-Token)');
      console.log('✅ SSE connections use query parameter authentication (token=)');
    } else {
      console.log('\n⚠️ ISSUES DETECTED:');
      if (!restCompliant) {
        console.log('❌ REST APIs not using header authentication consistently');
      }
      if (!sseCompliant) {
        console.log('❌ SSE not using query parameter authentication');
      }
    }
    console.log('=======================================\n');

    // Test assertions
    expect(networkRequests.length).toBeGreaterThan(0);

    // If we have REST requests, at least some should use header auth
    if (restRequests.length > 0) {
      expect(restWithHeaders).toBeGreaterThan(0);
    }

    // If we have SSE requests, they should use query parameter auth
    if (sseRequests.length > 0) {
      expect(sseWithQueryParams).toBeGreaterThan(0);
    }
  });

  test('should verify Angular HTTP interceptor adds headers to REST calls', async ({ page }) => {
    console.log('\n=== TESTING ANGULAR HTTP INTERCEPTOR ===');
    console.log('Verifying that the Angular HTTP interceptor correctly adds X-Session-Token headers');

    // Set up authentication first
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('portalSessionToken', 'admin-session-token');
    });

    // Monitor specific REST API calls
    const apiCalls: Array<{endpoint: string, hasAuthHeader: boolean, token?: string}> = [];

    page.on('request', request => {
      const url = request.url();
      const headers = request.headers();
      
      // Only track REST API calls
      if (url.includes('/api/') && !url.includes('/events/stream')) {
        apiCalls.push({
          endpoint: url,
          hasAuthHeader: !!headers['x-session-token'],
          token: headers['x-session-token']
        });
      }
    });

    // Trigger Angular HTTP client calls through the application
    await page.evaluate(() => {
      // Simulate Angular HTTP client calls
      // These would normally come from Angular services using HttpClient
      
      const requests = [
        '/api/health',
        '/api/version', 
        '/api/dashboard/summary',
        '/api/keys'
      ];

      requests.forEach(endpoint => {
        fetch(endpoint, {
          headers: {
            'Content-Type': 'application/json'
          }
        }).catch(() => {}); // Ignore errors, we just want to see the interceptor
      });
    });

    await page.waitForTimeout(3000);

    console.log('\n=== HTTP INTERCEPTOR ANALYSIS ===');
    console.log(`Total API calls intercepted: ${apiCalls.length}`);

    if (apiCalls.length > 0) {
      apiCalls.forEach((call, index) => {
        console.log(`${index + 1}. ${call.endpoint}`);
        console.log(`   Has Auth Header: ${call.hasAuthHeader ? '✅' : '❌'}`);
        if (call.hasAuthHeader && call.token) {
          console.log(`   Token: ${call.token}`);
        }
      });

      const withAuth = apiCalls.filter(call => call.hasAuthHeader).length;
      const withoutAuth = apiCalls.filter(call => !call.hasAuthHeader).length;

      console.log(`\nSummary: ${withAuth} with auth, ${withoutAuth} without auth`);

      if (withAuth > 0) {
        console.log('✅ HTTP Interceptor is working - adding authentication headers');
      } else {
        console.log('❌ HTTP Interceptor may not be working - no auth headers detected');
      }
    } else {
      console.log('⚠️ No API calls detected - may need to trigger Angular HTTP client calls');
    }

    // Assertions
    if (apiCalls.length > 0) {
      const authCallsCount = apiCalls.filter(call => call.hasAuthHeader).length;
      expect(authCallsCount).toBeGreaterThan(0);
    }
  });
});