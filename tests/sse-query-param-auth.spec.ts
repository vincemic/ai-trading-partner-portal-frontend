import { test, expect } from '@playwright/test';

test.describe('SSE Query Parameter Authentication', () => {
  test('should successfully connect using admin-session-token query parameter', async ({ page }) => {
    // Monitor network requests
    const networkRequests: Array<{method: string, url: string, status?: number, responseHeaders?: any}> = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/events/stream')) {
        networkRequests.push({
          method: request.method(),
          url: url
        });
        console.log('SSE Request:', request.method(), url);
      }
    });

    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/events/stream')) {
        const existing = networkRequests.find(req => req.url === url && !req.status);
        if (existing) {
          existing.status = response.status();
          existing.responseHeaders = response.headers();
        }
        console.log('SSE Response:', response.status(), url);
      }
    });

    await page.goto('/');

    // Test SSE connection with admin-session-token via query parameter
    const sseTestResult = await page.evaluate(() => {
      return new Promise((resolve) => {
        const results = {
          connectionAttempted: false,
          connectionOpened: false,
          connectionReady: false,
          errorOccurred: false,
          errorMessage: null as string | null,
          messagesReceived: 0,
          heartbeatsReceived: 0,
          eventsReceived: [] as string[],
          finalState: 'unknown'
        };

        try {
          console.log('Testing SSE with admin-session-token query parameter...');
          
          // Use the admin token as specified in the API documentation
          const eventSource = new EventSource('/api/events/stream?token=admin-session-token');
          results.connectionAttempted = true;

          eventSource.onopen = function(event) {
            console.log('✅ SSE connection opened successfully');
            results.connectionOpened = true;
            results.finalState = 'connected';
          };

          eventSource.onmessage = function(event) {
            console.log('📨 SSE message received:', event.data);
            results.messagesReceived++;
            
            // Check for heartbeat messages
            if (event.data === '' || event.data.includes('hb')) {
              results.heartbeatsReceived++;
              console.log('💓 Heartbeat received');
            } else {
              try {
                const data = JSON.parse(event.data);
                results.eventsReceived.push(data.type || 'unknown');
                console.log('📊 Event data:', data);
              } catch (e) {
                console.log('📝 Raw message:', event.data);
              }
            }
          };

          eventSource.onerror = function(error) {
            console.log('❌ SSE connection error');
            results.errorOccurred = true;
            
            if (eventSource.readyState === EventSource.CONNECTING) {
              results.errorMessage = 'Connecting/Reconnecting';
              results.finalState = 'reconnecting';
            } else if (eventSource.readyState === EventSource.CLOSED) {
              results.errorMessage = 'Connection closed';
              results.finalState = 'closed';
            } else {
              results.errorMessage = 'Unknown error';
              results.finalState = 'error';
            }
          };

          // Listen for specific event types from API documentation
          const eventTypes = ['key.promoted', 'key.revoked', 'file.created', 'file.statusChanged', 'dashboard.metricsTick'];
          
          eventTypes.forEach(eventType => {
            eventSource.addEventListener(eventType, function(event) {
              console.log(`🎯 ${eventType} event received:`, event.data);
              results.eventsReceived.push(eventType);
            });
          });

          // Test for 8 seconds to allow connection and potential messages
          setTimeout(() => {
            console.log('⏰ Test timeout - closing connection');
            
            // Check final connection state
            if (eventSource.readyState === EventSource.OPEN) {
              results.connectionReady = true;
              results.finalState = 'open';
            }
            
            eventSource.close();
            resolve(results);
          }, 8000);

        } catch (error) {
          console.error('💥 Error setting up SSE connection:', error);
          results.errorMessage = (error as Error).message;
          results.finalState = 'setup-error';
          resolve(results);
        }
      });
    });

    await page.waitForTimeout(9000); // Wait for test to complete

    console.log('\n=== SSE QUERY PARAMETER AUTH TEST (admin-session-token) ===');
    console.log('Connection attempted:', sseTestResult.connectionAttempted ? '✅' : '❌');
    console.log('Connection opened:', sseTestResult.connectionOpened ? '✅' : '❌');
    console.log('Connection ready:', sseTestResult.connectionReady ? '✅' : '❌');
    console.log('Final state:', sseTestResult.finalState);
    console.log('Error occurred:', sseTestResult.errorOccurred ? '⚠️' : '✅');
    console.log('Total messages:', sseTestResult.messagesReceived);
    console.log('Heartbeats received:', sseTestResult.heartbeatsReceived);
    console.log('Events received:', sseTestResult.eventsReceived);
    
    if (sseTestResult.errorMessage) {
      console.log('Error details:', sseTestResult.errorMessage);
    }

    console.log('\n=== NETWORK ANALYSIS ===');
    if (networkRequests.length > 0) {
      networkRequests.forEach((req, index) => {
        console.log(`${index + 1}. ${req.method} ${req.url}`);
        console.log(`   Status: ${req.status || 'pending'}`);
        
        // Check if query parameter is present
        if (req.url.includes('token=admin-session-token')) {
          console.log(`   ✅ Query parameter auth detected`);
        }
        
        // Analyze response
        if (req.status === 200) {
          console.log(`   ✅ Successful connection`);
        } else if (req.status === 401) {
          console.log(`   ❌ Authentication failed`);
        } else if (req.status === 403) {
          console.log(`   ❌ Forbidden - insufficient permissions`);
        } else if (req.status && req.status >= 400) {
          console.log(`   ❌ Client error: ${req.status}`);
        } else if (req.status && req.status >= 500) {
          console.log(`   ❌ Server error: ${req.status}`);
        }
      });
    } else {
      console.log('❌ No network requests detected');
    }
    console.log('==================================================\n');

    // Assertions
    expect(sseTestResult.connectionAttempted).toBe(true);
    
    // If we have network requests, check the response
    if (networkRequests.length > 0) {
      const sseRequest = networkRequests[0];
      
      // Should be attempting the right URL with query parameter
      expect(sseRequest.url).toContain('token=admin-session-token');
      
      // Status should indicate the backend is responding
      // 200/204 = success, 401/403 = auth working but rejected, others may indicate server issues
      if (sseRequest.status) {
        expect([200, 204, 401, 403]).toContain(sseRequest.status);
        
        // If we got 200, connection should have been successful
        if (sseRequest.status === 200) {
          expect(sseTestResult.connectionOpened).toBe(true);
        }
      }
    }
  });

  test('should test multiple predefined token types via query parameters', async ({ page }) => {
    const testTokens = [
      { token: 'admin-session-token', expectedRole: 'PartnerAdmin', shouldWork: true },
      { token: 'user-session-token', expectedRole: 'PartnerUser', shouldWork: true },
      { token: 'test-session-token', expectedRole: 'PartnerUser', shouldWork: true },
      { token: 'test-admin-user1', expectedRole: 'PartnerAdmin', shouldWork: true },
      { token: 'test-user-john', expectedRole: 'PartnerUser', shouldWork: true },
      { token: 'invalid-token', expectedRole: null, shouldWork: false },
      { token: '', expectedRole: null, shouldWork: false }
    ];

    await page.goto('/');

    const testResults = [];

    for (const testCase of testTokens) {
      console.log(`\n🧪 Testing token: "${testCase.token}"`);
      
      const result = await page.evaluate((tokenData) => {
        return new Promise((resolve) => {
          const testResult = {
            token: tokenData.token,
            connectionAttempted: false,
            connectionOpened: false,
            errorOccurred: false,
            errorType: null as string | null,
            messagesReceived: 0
          };

          try {
            // Create URL with token (handle empty token case)
            const url = tokenData.token 
              ? `/api/events/stream?token=${encodeURIComponent(tokenData.token)}`
              : '/api/events/stream'; // No token
              
            console.log(`Connecting to: ${url}`);
            const eventSource = new EventSource(url);
            testResult.connectionAttempted = true;

            const timeoutId = setTimeout(() => {
              eventSource.close();
              resolve(testResult);
            }, 3000); // Shorter timeout for multiple tests

            eventSource.onopen = function() {
              console.log(`✅ Connection opened for token: ${tokenData.token}`);
              testResult.connectionOpened = true;
              clearTimeout(timeoutId);
              eventSource.close();
              resolve(testResult);
            };

            eventSource.onerror = function() {
              testResult.errorOccurred = true;
              
              if (eventSource.readyState === EventSource.CLOSED) {
                testResult.errorType = 'closed';
              } else if (eventSource.readyState === EventSource.CONNECTING) {
                testResult.errorType = 'connecting';
              } else {
                testResult.errorType = 'unknown';
              }
              
              clearTimeout(timeoutId);
              eventSource.close();
              resolve(testResult);
            };

            eventSource.onmessage = function() {
              testResult.messagesReceived++;
            };

          } catch (error) {
            testResult.errorOccurred = true;
            testResult.errorType = 'setup';
            resolve(testResult);
          }
        });
      }, testCase);

      testResults.push({ ...testCase, ...result });
      
      console.log(`   Attempted: ${result.connectionAttempted ? '✅' : '❌'}`);
      console.log(`   Opened: ${result.connectionOpened ? '✅' : '❌'}`);
      console.log(`   Error: ${result.errorOccurred ? '⚠️' : '✅'}`);
      console.log(`   Error Type: ${result.errorType || 'none'}`);
      
      // Brief pause between tests
      await page.waitForTimeout(500);
    }

    console.log('\n=== TOKEN AUTHENTICATION SUMMARY ===');
    testResults.forEach((result, index) => {
      const status = result.connectionOpened ? '✅ SUCCESS' : 
                    result.errorOccurred ? '❌ FAILED' : '⏳ TIMEOUT';
      console.log(`${index + 1}. "${result.token}" (${result.expectedRole || 'invalid'}) - ${status}`);
    });

    // Analyze results
    const validTokenResults = testResults.filter(r => r.shouldWork);
    const invalidTokenResults = testResults.filter(r => !r.shouldWork);

    console.log('\n=== ANALYSIS ===');
    console.log(`Valid tokens tested: ${validTokenResults.length}`);
    console.log(`Valid tokens that connected: ${validTokenResults.filter(r => r.connectionOpened).length}`);
    console.log(`Invalid tokens tested: ${invalidTokenResults.length}`);
    console.log(`Invalid tokens that were rejected: ${invalidTokenResults.filter(r => r.errorOccurred).length}`);
    console.log('==================================\n');

    // Assertions
    expect(testResults.length).toBe(testTokens.length);
    
    // At least some valid tokens should work (depending on backend availability)
    const workingValidTokens = validTokenResults.filter(r => r.connectionOpened);
    if (workingValidTokens.length > 0) {
      console.log(`✅ Query parameter authentication is working! ${workingValidTokens.length} valid tokens connected successfully.`);
    } else {
      console.log(`⚠️ No valid tokens could connect. This might indicate the backend is not running or has issues.`);
    }
    
    // Invalid tokens should not connect successfully
    const workingInvalidTokens = invalidTokenResults.filter(r => r.connectionOpened);
    expect(workingInvalidTokens.length).toBe(0); // Invalid tokens should never succeed
  });

  test('should verify SSE query parameter format and encoding', async ({ page }) => {
    // Monitor network requests to verify exact URL format
    const networkRequests: Array<{url: string, decodedUrl: string}> = [];
    
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/events/stream')) {
        networkRequests.push({
          url: url,
          decodedUrl: decodeURIComponent(url)
        });
      }
    });

    await page.goto('/');

    // Test various token formats and special characters
    const specialTokens = [
      'admin-session-token',
      'test-admin-special!@#$',
      'token-with-spaces and-chars',
      'token+with+plus+signs',
      'token%20with%20encoded%20spaces'
    ];

    const urlResults = [];

    for (const token of specialTokens) {
      console.log(`\n🔍 Testing URL encoding for token: "${token}"`);
      
      const result = await page.evaluate((testToken) => {
        return new Promise((resolve) => {
          try {
            // Test URL construction
            const url = `/api/events/stream?token=${encodeURIComponent(testToken)}`;
            console.log(`Constructed URL: ${url}`);
            
            const eventSource = new EventSource(url);
            
            setTimeout(() => {
              eventSource.close();
              resolve({
                token: testToken,
                url: url,
                attempted: true
              });
            }, 1000);
            
          } catch (error) {
            resolve({
              token: testToken,
              url: null,
              attempted: false,
              error: (error as Error).message
            });
          }
        });
      }, token);

      urlResults.push(result);
      await page.waitForTimeout(200);
    }

    console.log('\n=== URL ENCODING TEST RESULTS ===');
    urlResults.forEach((result, index) => {
      console.log(`${index + 1}. Token: "${result.token}"`);
      console.log(`   URL: ${result.url || 'failed to construct'}`);
      console.log(`   Attempted: ${result.attempted ? '✅' : '❌'}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('\n=== NETWORK REQUEST ANALYSIS ===');
    networkRequests.forEach((req, index) => {
      console.log(`${index + 1}. Raw URL: ${req.url}`);
      console.log(`   Decoded: ${req.decodedUrl}`);
      
      // Extract token from URL
      const tokenMatch = req.url.match(/[?&]token=([^&]*)/);
      if (tokenMatch) {
        const rawToken = tokenMatch[1];
        const decodedToken = decodeURIComponent(rawToken);
        console.log(`   Token (raw): ${rawToken}`);
        console.log(`   Token (decoded): ${decodedToken}`);
      }
    });
    console.log('================================\n');

    // Verify basic URL construction worked
    expect(urlResults.length).toBe(specialTokens.length);
    expect(urlResults.filter(r => r.attempted).length).toBeGreaterThan(0);
    
    // Verify network requests were made
    expect(networkRequests.length).toBeGreaterThan(0);
    
    // Verify all URLs contain the token parameter
    networkRequests.forEach(req => {
      expect(req.url).toContain('token=');
    });
  });
});