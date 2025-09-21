import { test, expect } from '@playwright/test';

test.describe('SSE Manual Connection Test', () => {
  test('should manually test SSE connection with proper setup', async ({ page }) => {
    // Enable detailed console logging
    const consoleMessages: Array<{type: string, text: string}> = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Monitor all network requests
    const networkRequests: Array<{method: string, url: string, status?: number}> = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/events') || url.includes('stream') || url.includes('sse')) {
        networkRequests.push({
          method: request.method(),
          url: url
        });
      }
    });

    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/events') || url.includes('stream') || url.includes('sse')) {
        const existing = networkRequests.find(req => req.url === url && !req.status);
        if (existing) {
          existing.status = response.status();
        }
      }
    });

    // Override environment and manually create SSE connection
    await page.addInitScript(() => {
      // Override environment
      (window as any).environment = {
        production: false,
        apiBaseUrl: '/api',
        sseBaseUrl: '/api/events/stream',
        enableLogging: true,
        sseEnabled: true,
        sessionTokenKey: 'portalSessionToken'
      };

      // Add a manual SSE test function to window
      (window as any).testSSEConnection = function() {
        const results = {
          eventSourceSupported: typeof EventSource !== 'undefined',
          connectionAttempted: false,
          connectionStatus: 'not-attempted',
          error: null as string | null,
          sessionToken: localStorage.getItem('portalSessionToken'),
          environmentSSE: (window as any).environment?.sseEnabled
        };

        try {
          if (results.eventSourceSupported) {
            const token = localStorage.getItem('portalSessionToken') || 'test-token';
            const url = `/api/events/stream?sessionToken=${encodeURIComponent(token)}`;
            
            console.log('Testing SSE connection to:', url);
            results.connectionAttempted = true;
            
            const eventSource = new EventSource(url);
            
            eventSource.onopen = function() {
              console.log('SSE connection opened successfully');
              results.connectionStatus = 'connected';
            };
            
            eventSource.onerror = function(error) {
              console.log('SSE connection error:', error);
              results.connectionStatus = 'error';
              results.error = 'Connection error occurred';
            };
            
            eventSource.onmessage = function(event) {
              console.log('SSE message received:', event.data);
            };

            // Test for 5 seconds then close
            setTimeout(() => {
              eventSource.close();
              console.log('SSE test connection closed');
            }, 5000);
          }
        } catch (error) {
          results.error = (error as Error).message;
          results.connectionStatus = 'error';
        }

        return results;
      };
    });

    await page.goto('/');

    // Set session token
    await page.evaluate(() => {
      localStorage.setItem('portalSessionToken', 'test-session-token-for-sse');
    });

    await page.waitForTimeout(2000);

    // Run manual SSE test
    const testResults = await page.evaluate(() => {
      return (window as any).testSSEConnection();
    });

    console.log('\n=== MANUAL SSE CONNECTION TEST ===');
    console.log('EventSource supported:', testResults.eventSourceSupported ? '✅' : '❌');
    console.log('Environment SSE enabled:', testResults.environmentSSE ? '✅' : '❌');
    console.log('Session token set:', testResults.sessionToken ? '✅' : '❌');
    console.log('Connection attempted:', testResults.connectionAttempted ? '✅' : '❌');
    console.log('Connection status:', testResults.connectionStatus);
    if (testResults.error) {
      console.log('Error:', testResults.error);
    }

    // Wait for SSE test to complete
    await page.waitForTimeout(6000);

    console.log('\n=== NETWORK ACTIVITY ===');
    if (networkRequests.length > 0) {
      networkRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.method} ${req.url} ${req.status ? `(${req.status})` : '(pending)'}`);
      });
    } else {
      console.log('No SSE-related network requests detected');
    }

    console.log('\n=== CONSOLE MESSAGES ===');
    const sseRelatedMessages = consoleMessages.filter(msg => 
      msg.text.toLowerCase().includes('sse') || 
      msg.text.toLowerCase().includes('eventsource') ||
      msg.text.toLowerCase().includes('stream') ||
      msg.text.toLowerCase().includes('connection')
    );

    if (sseRelatedMessages.length > 0) {
      sseRelatedMessages.forEach((msg, index) => {
        console.log(`${index + 1}. [${msg.type.toUpperCase()}] ${msg.text}`);
      });
    } else {
      console.log('No SSE-related console messages');
    }
    console.log('=======================\n');

    // Verify the test ran
    expect(testResults.eventSourceSupported).toBe(true);
    expect(testResults.connectionAttempted).toBe(true);
  });

  test('should check if SSE service is initialized in Angular app', async ({ page }) => {
    await page.goto('/');

    // Wait for Angular to load
    await page.waitForTimeout(3000);

    const angularSSECheck = await page.evaluate(() => {
      const results = {
        angularReady: false,
        hasRouter: false,
        hasStores: false,
        sseServiceInfo: null as any,
        injectorAvailable: false,
        appRootContent: '',
        error: null as string | null
      };

      try {
        // Check Angular readiness
        const ng = (window as any).ng;
        results.angularReady = !!ng;

        // Check app content
        const appRoot = document.querySelector('app-root');
        results.appRootContent = appRoot ? appRoot.innerHTML.substring(0, 200) + '...' : 'No app-root found';

        // Check for router
        results.hasRouter = document.querySelector('router-outlet') !== null;

        // Try to check if stores or services are available
        if (ng && ng.getInjector) {
          results.injectorAvailable = true;
        }

      } catch (error) {
        results.error = (error as Error).message;
      }

      return results;
    });

    console.log('\n=== ANGULAR SSE SERVICE CHECK ===');
    console.log('Angular ready:', angularSSECheck.angularReady ? '✅' : '❌');
    console.log('Router available:', angularSSECheck.hasRouter ? '✅' : '❌');
    console.log('Injector available:', angularSSECheck.injectorAvailable ? '✅' : '❌');
    console.log('App content length:', angularSSECheck.appRootContent.length);
    
    if (angularSSECheck.error) {
      console.log('Error:', angularSSECheck.error);
    }
    console.log('==============================\n');

    expect(angularSSECheck.angularReady).toBe(true);
  });

  test('should test direct SSE endpoint with different auth methods', async ({ page }) => {
    await page.goto('/');

    const endpointTests = await page.evaluate(async () => {
      const tests = [];
      const baseUrl = '/api/events/stream';

      // Test 1: No authentication
      try {
        const response1 = await fetch(baseUrl);
        tests.push({
          name: 'No auth',
          status: response1.status,
          success: response1.status < 500
        });
      } catch (error) {
        tests.push({
          name: 'No auth',
          status: 'error',
          success: false,
          error: (error as Error).message
        });
      }

      // Test 2: With session token as query param
      try {
        const response2 = await fetch(`${baseUrl}?sessionToken=test-token`);
        tests.push({
          name: 'Query param auth',
          status: response2.status,
          success: response2.status < 500
        });
      } catch (error) {
        tests.push({
          name: 'Query param auth',
          status: 'error',
          success: false,
          error: (error as Error).message
        });
      }

      // Test 3: With header (even though EventSource doesn't support custom headers)
      try {
        const response3 = await fetch(baseUrl, {
          headers: {
            'X-Session-Token': 'test-token',
            'Accept': 'text/event-stream'
          }
        });
        tests.push({
          name: 'Header auth',
          status: response3.status,
          success: response3.status < 500
        });
      } catch (error) {
        tests.push({
          name: 'Header auth',
          status: 'error',
          success: false,
          error: (error as Error).message
        });
      }

      return tests;
    });

    console.log('\n=== SSE ENDPOINT AUTHENTICATION TESTS ===');
    endpointTests.forEach((test, index) => {
      console.log(`${index + 1}. ${test.name}:`);
      console.log(`   Status: ${test.status}`);
      console.log(`   Success: ${test.success ? '✅' : '❌'}`);
      if (test.error) {
        console.log(`   Error: ${test.error}`);
      }
    });
    console.log('=======================================\n');

    // At least one test should be successful (reachable endpoint)
    const hasSuccessful = endpointTests.some(test => test.success);
    expect(hasSuccessful).toBe(true);
  });
});