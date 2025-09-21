import { test, expect } from '@playwright/test';

test.describe('SSE Connection with Authentication', () => {
  test('should test SSE connection with session token', async ({ page }) => {
    await page.goto('/');

    // Set up session token in localStorage to simulate authentication
    await page.evaluate(() => {
      localStorage.setItem('portalSessionToken', 'test-session-token');
    });

    // Monitor network requests for SSE endpoint
    const networkRequests: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/events') || url.includes('stream')) {
        networkRequests.push(`${request.method()} ${url}`);
        console.log('SSE Network Request:', request.method(), url);
      }
    });

    // Monitor console for SSE messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.toLowerCase().includes('sse') || text.includes('EventSource') || text.includes('stream')) {
        consoleMessages.push(text);
        console.log('SSE Console:', text);
      }
    });

    // Reload the page to trigger SSE connection with token
    await page.reload();
    await page.waitForTimeout(5000); // Wait for SSE connection attempt

    const sseStatus = await page.evaluate(() => {
      const info = {
        hasSessionToken: !!localStorage.getItem('portalSessionToken'),
        environment: (window as any).environment,
        angularLoaded: !!(window as any).ng,
        pageTitle: document.title,
        currentUrl: window.location.href
      };
      return info;
    });

    console.log('\n=== SSE Connection Test Results ===');
    console.log('Session Token Set:', sseStatus.hasSessionToken);
    console.log('SSE Enabled in Environment:', sseStatus.environment?.sseEnabled);
    console.log('SSE Base URL:', sseStatus.environment?.sseBaseUrl);
    console.log('Angular Loaded:', sseStatus.angularLoaded);
    console.log('Network Requests:', networkRequests.length);
    console.log('Console Messages:', consoleMessages.length);
    
    if (networkRequests.length > 0) {
      console.log('Network Requests Details:');
      networkRequests.forEach((req, index) => console.log(`  ${index + 1}. ${req}`));
    }
    
    if (consoleMessages.length > 0) {
      console.log('Console Messages Details:');
      consoleMessages.forEach((msg, index) => console.log(`  ${index + 1}. ${msg}`));
    }
    console.log('================================\n');

    // Verify that SSE is properly configured
    expect(sseStatus.hasSessionToken).toBe(true);
    expect(sseStatus.environment?.sseEnabled).toBe(true);
  });

  test('should check SSE service connection status', async ({ page }) => {
    await page.goto('/');

    // Simulate authentication
    await page.evaluate(() => {
      localStorage.setItem('portalSessionToken', 'test-session-token');
    });

    await page.reload();
    await page.waitForTimeout(3000);

    // Try to access the SSE service and check its status
    const serviceStatus = await page.evaluate(() => {
      const results = {
        hasEventSource: typeof EventSource !== 'undefined',
        canCreateEventSource: false,
        eventSourceError: null as string | null,
        environmentCheck: {
          sseEnabled: false,
          sseBaseUrl: null as string | null,
          hasSessionToken: false
        }
      };

      // Check environment
      const env = (window as any).environment;
      if (env) {
        results.environmentCheck.sseEnabled = env.sseEnabled;
        results.environmentCheck.sseBaseUrl = env.sseBaseUrl;
      }

      results.environmentCheck.hasSessionToken = !!localStorage.getItem('portalSessionToken');

      // Test EventSource creation
      if (results.hasEventSource) {
        try {
          const testUrl = results.environmentCheck.sseBaseUrl + '?sessionToken=test-token';
          const testEventSource = new EventSource(testUrl);
          results.canCreateEventSource = true;
          testEventSource.close();
        } catch (error) {
          results.eventSourceError = (error as Error).message;
        }
      }

      return results;
    });

    console.log('\n=== SSE Service Status ===');
    console.log('EventSource Support:', serviceStatus.hasEventSource ? '✅' : '❌');
    console.log('Can Create EventSource:', serviceStatus.canCreateEventSource ? '✅' : '❌');
    console.log('SSE Enabled:', serviceStatus.environmentCheck.sseEnabled ? '✅' : '❌');
    console.log('SSE Base URL:', serviceStatus.environmentCheck.sseBaseUrl);
    console.log('Has Session Token:', serviceStatus.environmentCheck.hasSessionToken ? '✅' : '❌');
    
    if (serviceStatus.eventSourceError) {
      console.log('EventSource Error:', serviceStatus.eventSourceError);
    }
    console.log('========================\n');

    expect(serviceStatus.hasEventSource).toBe(true);
    expect(serviceStatus.environmentCheck.sseEnabled).toBe(true);
    expect(serviceStatus.environmentCheck.hasSessionToken).toBe(true);
  });
});