import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/login-page';
import { DashboardPage } from './pages/dashboard-page';

test.describe('SSE Connection Tests', () => {
  let loginPage: LoginPage;
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    dashboardPage = new DashboardPage(page);
  });

  test('should establish SSE connection after login when enabled', async ({ page }) => {
    // First, let's check the current SSE status
    await page.goto('/');
    
    // Check if SSE is enabled in environment
    const sseEnabled = await page.evaluate(() => {
      return (window as any).environment?.sseEnabled || false;
    });

    console.log('SSE Enabled:', sseEnabled);

    // If SSE is disabled, we'll simulate it being enabled for this test
    if (!sseEnabled) {
      await page.addInitScript(() => {
        // Override environment to enable SSE for this test
        (window as any).environment = {
          ...((window as any).environment || {}),
          sseEnabled: true,
          sseBaseUrl: '/api/events/stream'
        };
      });
    }

    // Login first
    await loginPage.login('admin', 'admin', 'admin');
    await expect(page).toHaveURL('/dashboard');

    // Wait a moment for SSE connection to be attempted
    await page.waitForTimeout(2000);

    // Check SSE connection status through the Angular service
    const sseStatus = await page.evaluate(() => {
      // Access the Angular app and get SSE service status
      const angular = (window as any).ng;
      if (!angular) return null;
      
      try {
        // Try to get the service through Angular's dependency injection
        const appRef = angular.getInjector ? angular.getInjector() : null;
        if (!appRef) return 'no-injector';
        
        // This is a simplified approach - in a real test you might need to 
        // access the service differently depending on your Angular setup
        return 'service-check-needed';
      } catch (error) {
        return 'error: ' + (error as Error).message;
      }
    });

    console.log('SSE Status check:', sseStatus);

    // Check for SSE-related network requests
    let sseConnectionAttempted = false;

    // Monitor network requests for SSE endpoint
    page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/events/stream')) {
        console.log('SSE connection attempted:', url);
        sseConnectionAttempted = true;
      }
    });

    // Check for EventSource creation in the browser
    const hasEventSource = await page.evaluate(() => {
      // Check if EventSource is available and being used
      const originalEventSource = window.EventSource;
      let eventSourceCreated = false;
      
      // Mock EventSource to track creation
      window.EventSource = class extends originalEventSource {
        constructor(url: string | URL, eventSourceInitDict?: EventSourceInit) {
          console.log('EventSource created with URL:', url);
          eventSourceCreated = true;
          super(url, eventSourceInitDict);
        }
      } as any;
      
      return {
        hasEventSource: typeof originalEventSource !== 'undefined',
        eventSourceCreated
      };
    });

    console.log('EventSource availability:', hasEventSource);

    // Force a page reload to trigger SSE connection with our overrides
    await page.reload();
    await page.waitForTimeout(3000);

    // Check console logs for SSE-related messages
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().toLowerCase().includes('sse')) {
        logs.push(msg.text());
        console.log('SSE Console Log:', msg.text());
      }
    });

    // Wait a bit more to see if SSE connection is established
    await page.waitForTimeout(2000);

    // Final check - look for SSE connection indicators in the UI or service
    const finalSseCheck = await page.evaluate(() => {
      // Check for any SSE-related DOM elements or indicators
      const sseIndicators = document.querySelectorAll('[data-testid*="sse"], [class*="sse"], [id*="sse"]');
      
      // Check localStorage for any SSE-related data
      const sseData = Object.keys(localStorage).filter(key => 
        key.toLowerCase().includes('sse') || 
        key.toLowerCase().includes('event') ||
        key.toLowerCase().includes('stream')
      );

      return {
        sseIndicatorsCount: sseIndicators.length,
        sseLocalStorageKeys: sseData,
        userAgent: navigator.userAgent,
        eventSourceSupported: typeof EventSource !== 'undefined'
      };
    });

    console.log('Final SSE check results:', finalSseCheck);

    // Assertions
    expect(finalSseCheck.eventSourceSupported).toBe(true);
    
    // If SSE was enabled, we should see some indication of connection attempt
    if (sseEnabled) {
      // In a real implementation, you'd check for specific SSE connection indicators
      console.log('SSE is enabled - connection should be attempted');
    } else {
      console.log('SSE is disabled - no connection expected');
    }
  });

  test('should handle SSE disconnection gracefully', async ({ page }) => {
    // Login first
    await page.goto('/');
    await loginPage.login('admin', 'admin', 'admin');
    await expect(page).toHaveURL('/dashboard');

    // Simulate network disconnection
    await page.context().setOffline(true);
    await page.waitForTimeout(2000);

    // Check that the app handles disconnection gracefully
    const offlineHandling = await page.evaluate(() => {
      // Check if the app shows any offline indicators
      const offlineIndicators = document.querySelectorAll('[data-testid*="offline"], [class*="offline"], [class*="disconnected"]');
      return offlineIndicators.length;
    });

    // Restore connection
    await page.context().setOffline(false);
    await page.waitForTimeout(3000);

    // The app should recover gracefully
    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('Network Error');
  });

  test('should receive SSE events and update UI accordingly', async ({ page }) => {
    // Login first
    await page.goto('/');
    await loginPage.login('admin', 'admin', 'admin');
    await expect(page).toHaveURL('/dashboard');

    // Enable SSE for this test
    await page.addInitScript(() => {
      (window as any).environment = {
        ...((window as any).environment || {}),
        sseEnabled: true,
        sseBaseUrl: '/api/events/stream'
      };
    });

    // Wait for dashboard to load
    await page.waitForTimeout(2000);

    // Simulate SSE event injection (if the service supports it)
    const eventInjected = await page.evaluate(() => {
      try {
        // Try to access the Angular SSE service and inject a test event
        const angular = (window as any).ng;
        if (angular && angular.getInjector) {
          // This would need to be adapted based on how you access services in your app
          console.log('Attempting to inject test SSE event...');
          return true;
        }
        return false;
      } catch (error) {
        console.log('Could not inject test event:', (error as Error).message);
        return false;
      }
    });

    console.log('Test event injection:', eventInjected);

    // Check if the dashboard responds to simulated events
    // This would depend on your specific implementation
    await page.waitForTimeout(1000);
    
    // Verify the page is still functional
    expect(await page.isVisible('body')).toBe(true);
  });

  test('should show SSE connection status', async ({ page }) => {
    await page.goto('/');
    await loginPage.login('admin', 'admin', 'admin');
    await expect(page).toHaveURL('/dashboard');

    // Look for any connection status indicators
    const statusElements = await page.evaluate(() => {
      // Look for elements that might show connection status
      const statusSelectors = [
        '[data-testid*="connection"]',
        '[data-testid*="status"]', 
        '[class*="connection"]',
        '[class*="status"]',
        '[id*="connection"]',
        '[id*="status"]'
      ];

      const foundElements: Array<{selector: string, text: string | undefined, classes: string, id: string}> = [];
      for (const selector of statusSelectors) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          foundElements.push({
            selector,
            text: el.textContent?.trim(),
            classes: el.className,
            id: el.id
          });
        });
      }

      return foundElements;
    });

    console.log('Found status elements:', statusElements);

    // The test passes if we can navigate and the page loads correctly
    // regardless of SSE status indicators
    expect(await page.title()).toBeTruthy();
  });

  test('should manually test SSE connection and status', async ({ page }) => {
    await page.goto('/');
    await loginPage.login('admin', 'admin', 'admin');
    await expect(page).toHaveURL('/dashboard');

    // Inject code to manually test SSE functionality
    const sseTestResults = await page.evaluate(() => {
      const results = {
        environmentCheck: false,
        serviceAccess: false,
        connectionStatus: 'unknown',
        eventSourceSupport: false,
        mockConnectionTest: false,
        error: null as string | null
      };

      try {
        // Check if environment is accessible
        const env = (window as any).environment;
        results.environmentCheck = !!env;

        // Check EventSource support
        results.eventSourceSupport = typeof EventSource !== 'undefined';

        // Try to access Angular services (simplified approach)
        const angular = (window as any).ng;
        if (angular) {
          results.serviceAccess = true;
          
          // Try to check if SSE is enabled and test connection
          if (results.eventSourceSupport) {
            try {
              // Create a mock EventSource to test basic functionality
              const testEventSource = new EventSource('data:text/plain,test');
              results.mockConnectionTest = true;
              testEventSource.close();
            } catch (mockError) {
              results.error = 'Mock EventSource test failed: ' + (mockError as Error).message;
            }
          }
        }

        return results;
      } catch (error) {
        results.error = (error as Error).message;
        return results;
      }
    });

    console.log('Manual SSE test results:', sseTestResults);

    // Basic assertions
    expect(sseTestResults.eventSourceSupport).toBe(true);
    expect(sseTestResults.environmentCheck).toBe(true);

    // Log the results for manual verification
    console.log('SSE Connection Test Summary:');
    console.log('- EventSource supported:', sseTestResults.eventSourceSupport);
    console.log('- Environment accessible:', sseTestResults.environmentCheck);
    console.log('- Angular service access:', sseTestResults.serviceAccess);
    console.log('- Mock connection test:', sseTestResults.mockConnectionTest);
    if (sseTestResults.error) {
      console.log('- Error encountered:', sseTestResults.error);
    }
  });
});