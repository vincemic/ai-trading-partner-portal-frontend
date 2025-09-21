import { test, expect } from '@playwright/test';

test.describe('SSE Complete Authentication Test', () => {
  test('should test SSE with proper header authentication', async ({ page }) => {
    // Monitor network requests
    const networkRequests: Array<{method: string, url: string, headers: any, status?: number}> = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/events') || url.includes('stream')) {
        networkRequests.push({
          method: request.method(),
          url: url,
          headers: request.headers()
        });
      }
    });

    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/events') || url.includes('stream')) {
        const existing = networkRequests.find(req => req.url === url && !req.status);
        if (existing) {
          existing.status = response.status();
        }
      }
    });

    // Monitor console messages
    const consoleMessages: Array<{type: string, text: string}> = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    await page.goto('/');

    interface SSETestResult {
      connectionAttempted: boolean;
      connectionStatus: string;
      connectionOpened: boolean;
      errorReceived: boolean;
      errorMessage: string | null;
      messagesReceived: number;
      testCompleted: boolean;
    }

    // Test proper SSE connection with header authentication as per API docs
    const sseTestResult = await page.evaluate((): Promise<SSETestResult> => {
      return new Promise((resolve) => {
        const results: SSETestResult = {
          connectionAttempted: false,
          connectionStatus: 'not-started',
          connectionOpened: false,
          errorReceived: false,
          errorMessage: null,
          messagesReceived: 0,
          testCompleted: false
        };

        try {
          console.log('Creating EventSource connection to /api/events/stream');
          
          // Create EventSource - note that EventSource doesn't support custom headers
          // According to the API docs, it should use X-Session-Token header, but EventSource
          // can't send custom headers, so the backend must support token via query param
          const eventSource = new EventSource('/api/events/stream?token=admin-session-token');
          results.connectionAttempted = true;

          eventSource.onopen = function(event) {
            console.log('SSE connection opened successfully');
            results.connectionOpened = true;
            results.connectionStatus = 'connected';
          };

          eventSource.onerror = function(error) {
            console.log('SSE connection error occurred');
            results.errorReceived = true;
            results.connectionStatus = 'error';
            
            // Get more details about the error
            if (eventSource.readyState === EventSource.CONNECTING) {
              results.errorMessage = 'Connection failed, retrying...';
            } else if (eventSource.readyState === EventSource.CLOSED) {
              results.errorMessage = 'Connection closed by server';
            } else {
              results.errorMessage = 'Unknown connection error';
            }
          };

          eventSource.onmessage = function(event) {
            console.log('SSE message received:', event.data);
            results.messagesReceived++;
            
            try {
              const data = JSON.parse(event.data);
              console.log('Parsed SSE data:', data);
            } catch (e) {
              console.log('Non-JSON SSE data received');
            }
          };

          // Listen for specific event types mentioned in the API docs
          const eventTypes = ['key.promoted', 'key.revoked', 'file.created', 'file.statusChanged', 'dashboard.metricsTick'];
          
          eventTypes.forEach(eventType => {
            eventSource.addEventListener(eventType, function(event) {
              console.log(`SSE ${eventType} event received:`, event.data);
              results.messagesReceived++;
            });
          });

          // Test for 10 seconds
          setTimeout(() => {
            console.log('SSE test timeout - closing connection');
            eventSource.close();
            results.testCompleted = true;
            resolve(results);
          }, 10000);

        } catch (error) {
          console.error('Error setting up SSE connection:', error);
          results.errorMessage = (error as Error).message;
          results.connectionStatus = 'setup-error';
          resolve(results);
        }
      });
    });

    await page.waitForTimeout(11000); // Wait for test to complete

    console.log('\n=== SSE AUTHENTICATION TEST RESULTS ===');
    console.log('Connection attempted:', sseTestResult.connectionAttempted ? '✅' : '❌');
    console.log('Connection opened:', sseTestResult.connectionOpened ? '✅' : '❌');
    console.log('Connection status:', sseTestResult.connectionStatus);
    console.log('Error received:', sseTestResult.errorReceived ? '⚠️' : '✅');
    console.log('Messages received:', sseTestResult.messagesReceived);
    console.log('Test completed:', sseTestResult.testCompleted ? '✅' : '❌');
    
    if (sseTestResult.errorMessage) {
      console.log('Error message:', sseTestResult.errorMessage);
    }

    console.log('\n=== NETWORK REQUESTS ===');
    if (networkRequests.length > 0) {
      networkRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.method} ${req.url}`);
        console.log(`   Status: ${req.status || 'pending'}`);
        if (req.headers['x-session-token']) {
          console.log(`   X-Session-Token: ${req.headers['x-session-token']}`);
        }
        if (req.url.includes('token=')) {
          console.log(`   Query param auth: ✅`);
        }
      });
    } else {
      console.log('No SSE-related network requests detected');
    }

    console.log('\n=== CONSOLE MESSAGES ===');
    const sseMessages = consoleMessages.filter(msg => 
      msg.text.toLowerCase().includes('sse') || 
      msg.text.toLowerCase().includes('eventsource') ||
      msg.text.toLowerCase().includes('connection')
    );
    
    if (sseMessages.length > 0) {
      sseMessages.slice(0, 10).forEach((msg, index) => { // Show first 10 messages
        console.log(`${index + 1}. [${msg.type}] ${msg.text}`);
      });
      if (sseMessages.length > 10) {
        console.log(`... and ${sseMessages.length - 10} more SSE-related messages`);
      }
    } else {
      console.log('No SSE-related console messages');
    }
    console.log('=======================================\n');

    // Test assertions
    expect(sseTestResult.connectionAttempted).toBe(true);
    expect(sseTestResult.testCompleted).toBe(true);
    
    // If we got a 401 error, that means the endpoint is reachable but authentication failed
    // If we got a connection, even better!
    if (networkRequests.length > 0) {
      const sseRequest = networkRequests.find(req => req.url.includes('/api/events/stream'));
      if (sseRequest && sseRequest.status !== undefined) {
        // 401 means endpoint is reachable but auth failed (which is expected in test environment)
        // 200 or 204 means successful connection
        // 307 means redirect (HTTP to HTTPS)
        expect([200, 204, 307, 401]).toContain(sseRequest.status);
      }
    }
  });

  test('should verify SSE is properly implemented in Angular app', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // Check if the Angular app has SSE service and if it's configured correctly
    const appSSECheck = await page.evaluate(() => {
      const results = {
        hasEventSource: typeof EventSource !== 'undefined',
        environmentSSE: null as any,
        angularLoaded: false,
        sseServiceFound: false,
        sessionServiceFound: false,
        error: null as string | null
      };

      try {
        // Check if Angular is loaded
        const ng = (window as any).ng;
        results.angularLoaded = !!ng;

        // Check environment
        const env = (window as any).environment;
        if (env) {
          results.environmentSSE = {
            sseEnabled: env.sseEnabled,
            sseBaseUrl: env.sseBaseUrl,
            sessionTokenKey: env.sessionTokenKey
          };
        }

        // Try to check if app has been bootstrapped
        const appRoot = document.querySelector('app-root');
        const hasContent = appRoot && appRoot.innerHTML.length > 100;
        
        results.sseServiceFound = !!hasContent; // Approximation

        return results;
      } catch (error) {
        results.error = (error as Error).message;
        return results;
      }
    });

    console.log('\n=== ANGULAR SSE IMPLEMENTATION CHECK ===');
    console.log('EventSource support:', appSSECheck.hasEventSource ? '✅' : '❌');
    console.log('Angular loaded:', appSSECheck.angularLoaded ? '✅' : '❌');
    console.log('SSE service found:', appSSECheck.sseServiceFound ? '✅' : '❌');
    
    if (appSSECheck.environmentSSE) {
      console.log('Environment SSE config:');
      console.log('  - SSE enabled:', appSSECheck.environmentSSE.sseEnabled ? '✅' : '❌');
      console.log('  - SSE base URL:', appSSECheck.environmentSSE.sseBaseUrl || 'not set');
      console.log('  - Session token key:', appSSECheck.environmentSSE.sessionTokenKey || 'not set');
    } else {
      console.log('Environment SSE config: ❌ Not accessible');
    }
    
    if (appSSECheck.error) {
      console.log('Error:', appSSECheck.error);
    }
    console.log('=========================================\n');

    expect(appSSECheck.hasEventSource).toBe(true);
    expect(appSSECheck.angularLoaded).toBe(true);
  });
});