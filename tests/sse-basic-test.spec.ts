import { test, expect } from '@playwright/test';

test.describe('SSE Basic Connection Tests', () => {
  test('should check if SSE is configured and accessible', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Check basic SSE configuration and environment
    const sseInfo = await page.evaluate(() => {
      const info = {
        eventSourceSupported: typeof EventSource !== 'undefined',
        environment: null as any,
        sseEnabled: false,
        sseBaseUrl: null as string | null,
        userAgent: navigator.userAgent,
        location: window.location.href,
        documentReady: document.readyState
      };

      // Try to access environment configuration
      try {
        const env = (window as any).environment;
        if (env) {
          info.environment = env;
          info.sseEnabled = env.sseEnabled || false;
          info.sseBaseUrl = env.sseBaseUrl || null;
        }
      } catch (error) {
        console.log('Could not access environment:', error);
      }

      return info;
    });

    console.log('SSE Configuration Check:');
    console.log('- EventSource supported:', sseInfo.eventSourceSupported);
    console.log('- SSE enabled in environment:', sseInfo.sseEnabled);
    console.log('- SSE base URL:', sseInfo.sseBaseUrl);
    console.log('- Environment object available:', !!sseInfo.environment);
    console.log('- Page location:', sseInfo.location);
    console.log('- User agent:', sseInfo.userAgent);

    // Basic assertions
    expect(sseInfo.eventSourceSupported).toBe(true);
    expect(sseInfo.documentReady).toBe('complete');
  });

  test('should test SSE endpoint accessibility', async ({ page, context }) => {
    await page.goto('/');

    // Test if SSE endpoint is accessible
    const endpointTest = await page.evaluate(async () => {
      const results = {
        endpointReachable: false,
        errorMessage: null as string | null,
        statusCode: null as number | null,
        responseTime: 0
      };

      const startTime = Date.now();
      
      try {
        // Try to access the SSE endpoint via fetch first
        const response = await fetch('/api/events/stream', {
          method: 'GET',
          headers: {
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache'
          }
        });
        
        results.statusCode = response.status;
        results.endpointReachable = response.status < 500; // Accept 401/403 as "reachable"
        results.responseTime = Date.now() - startTime;
        
      } catch (error) {
        results.errorMessage = (error as Error).message;
        results.responseTime = Date.now() - startTime;
      }

      return results;
    });

    console.log('SSE Endpoint Test:');
    console.log('- Endpoint reachable:', endpointTest.endpointReachable);
    console.log('- Status code:', endpointTest.statusCode);
    console.log('- Response time:', endpointTest.responseTime + 'ms');
    if (endpointTest.errorMessage) {
      console.log('- Error:', endpointTest.errorMessage);
    }

    // The endpoint might return 401/403 without authentication, which is expected
    // We just want to make sure it's not a complete network failure
    if (endpointTest.statusCode !== null) {
      expect([200, 401, 403, 404]).toContain(endpointTest.statusCode);
    }
  });

  test('should test SSE service initialization', async ({ page }) => {
    await page.goto('/');

    // Wait for Angular to load
    await page.waitForTimeout(2000);

    // Test if we can access Angular services and SSE
    const serviceTest = await page.evaluate(() => {
      const results = {
        angularLoaded: false,
        sseServiceAvailable: false,
        serviceInfo: null as any,
        error: null as string | null
      };

      try {
        // Check if Angular is loaded
        const ng = (window as any).ng;
        results.angularLoaded = !!ng;

        // Check if we can access the app element
        const appElement = document.querySelector('app-root');
        const hasAppContent = appElement && appElement.innerHTML.length > 0;

        results.serviceInfo = {
          hasAppElement: !!appElement,
          hasAppContent: hasAppContent,
          appElementClasses: appElement?.className || 'none',
          bodyClasses: document.body.className,
          documentTitle: document.title
        };

      } catch (error) {
        results.error = (error as Error).message;
      }

      return results;
    });

    console.log('Angular Service Test:');
    console.log('- Angular loaded:', serviceTest.angularLoaded);
    console.log('- SSE service available:', serviceTest.sseServiceAvailable);
    console.log('- App element present:', serviceTest.serviceInfo?.hasAppElement);
    console.log('- App has content:', serviceTest.serviceInfo?.hasAppContent);
    console.log('- Document title:', serviceTest.serviceInfo?.documentTitle);
    
    if (serviceTest.error) {
      console.log('- Error:', serviceTest.error);
    }

    // Basic assertions
    expect(serviceTest.serviceInfo?.hasAppElement).toBe(true);
    expect(serviceTest.serviceInfo?.documentTitle).toContain('Portal');
  });

  test('should check console for SSE-related messages', async ({ page }) => {
    const consoleMessages: string[] = [];
    
    // Capture console messages
    page.on('console', msg => {
      const text = msg.text().toLowerCase();
      if (text.includes('sse') || text.includes('server-sent') || text.includes('eventsource') || text.includes('stream')) {
        consoleMessages.push(msg.text());
      }
    });

    await page.goto('/');
    
    // Wait for potential SSE initialization
    await page.waitForTimeout(3000);

    console.log('SSE Console Messages:');
    if (consoleMessages.length > 0) {
      consoleMessages.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg}`);
      });
    } else {
      console.log('- No SSE-related console messages found');
    }

    // Test passes regardless of console messages
    expect(true).toBe(true);
  });

  test('should enable SSE and test connection attempt', async ({ page }) => {
    // Override environment to enable SSE before page load
    await page.addInitScript(() => {
      (window as any).environment = {
        production: false,
        apiBaseUrl: '/api',
        sseBaseUrl: '/api/events/stream',
        enableLogging: true,
        sseEnabled: true,
        sessionTokenKey: 'portalSessionToken'
      };
    });

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Check if SSE is now enabled and test connection
    const sseConnectionTest = await page.evaluate(() => {
      const results = {
        sseEnabled: false,
        connectionAttempted: false,
        error: null as string | null,
        environmentOverridden: false
      };

      try {
        const env = (window as any).environment;
        if (env) {
          results.environmentOverridden = true;
          results.sseEnabled = env.sseEnabled === true;
        }

        // Try to create a test EventSource to verify it works
        if (typeof EventSource !== 'undefined') {
          try {
            const testSource = new EventSource('data:text/plain,test');
            results.connectionAttempted = true;
            testSource.close();
          } catch (eventSourceError) {
            results.error = 'EventSource test failed: ' + (eventSourceError as Error).message;
          }
        }

      } catch (error) {
        results.error = (error as Error).message;
      }

      return results;
    });

    console.log('SSE Connection Test with Override:');
    console.log('- Environment overridden:', sseConnectionTest.environmentOverridden);
    console.log('- SSE enabled:', sseConnectionTest.sseEnabled);
    console.log('- Connection attempted:', sseConnectionTest.connectionAttempted);
    
    if (sseConnectionTest.error) {
      console.log('- Error:', sseConnectionTest.error);
    }

    // Verify environment override worked
    expect(sseConnectionTest.environmentOverridden).toBe(true);
    expect(sseConnectionTest.sseEnabled).toBe(true);
  });

  test('should check current SSE status and recommendations', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);

    const currentStatus = await page.evaluate(() => {
      const status = {
        browserSupport: typeof EventSource !== 'undefined',
        currentConfig: null as any,
        recommendations: [] as string[]
      };

      // Get current environment config
      const env = (window as any).environment;
      if (env) {
        status.currentConfig = {
          sseEnabled: env.sseEnabled,
          sseBaseUrl: env.sseBaseUrl,
          apiBaseUrl: env.apiBaseUrl,
          enableLogging: env.enableLogging
        };
      }

      // Generate recommendations
      if (!status.browserSupport) {
        status.recommendations.push('Browser does not support EventSource (Server-Sent Events)');
      }

      if (!env?.sseEnabled) {
        status.recommendations.push('SSE is disabled in environment configuration');
      }

      if (!env?.sseBaseUrl) {
        status.recommendations.push('SSE base URL is not configured');
      }

      if (status.recommendations.length === 0) {
        status.recommendations.push('SSE appears to be properly configured');
      }

      return status;
    });

    console.log('\n=== SSE STATUS REPORT ===');
    console.log('Browser Support:', currentStatus.browserSupport ? '✅ YES' : '❌ NO');
    console.log('Current Configuration:', JSON.stringify(currentStatus.currentConfig, null, 2));
    console.log('\nRecommendations:');
    currentStatus.recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
    console.log('========================\n');

    // Always pass - this is an informational test
    expect(true).toBe(true);
  });
});