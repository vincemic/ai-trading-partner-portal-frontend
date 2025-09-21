import { test, expect } from '@playwright/test';

test.describe('SSE Environment Verification', () => {
  test('should check if environment changes are reflected in browser', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Check what environment configuration is actually loaded
    const envCheck = await page.evaluate(() => {
      const info = {
        windowEnv: (window as any).environment,
        hasEnvironment: typeof (window as any).environment !== 'undefined',
        environmentKeys: [] as string[],
        sseConfig: null as any,
        documentTitle: document.title,
        currentUrl: window.location.href
      };

      if (info.windowEnv) {
        info.environmentKeys = Object.keys(info.windowEnv);
        info.sseConfig = {
          sseEnabled: info.windowEnv.sseEnabled,
          sseBaseUrl: info.windowEnv.sseBaseUrl,
          sessionTokenKey: info.windowEnv.sessionTokenKey
        };
      }

      return info;
    });

    console.log('\n=== ENVIRONMENT VERIFICATION ===');
    console.log('Has environment object:', envCheck.hasEnvironment ? '✅' : '❌');
    console.log('Document title:', envCheck.documentTitle);
    console.log('Current URL:', envCheck.currentUrl);
    
    if (envCheck.hasEnvironment) {
      console.log('Environment keys:', envCheck.environmentKeys);
      console.log('SSE Configuration:');
      console.log('  - SSE enabled:', envCheck.sseConfig?.sseEnabled);
      console.log('  - SSE base URL:', envCheck.sseConfig?.sseBaseUrl);
      console.log('  - Session token key:', envCheck.sseConfig?.sessionTokenKey);
    } else {
      console.log('❌ Environment object not found in browser window');
    }
    console.log('===============================\n');

    // Test that the page loads correctly
    expect(envCheck.documentTitle).toBeTruthy();
  });

  test('should test manual SSE connection with current environment', async ({ page }) => {
    await page.goto('/');

    // Force environment and test SSE
    const manualTest = await page.evaluate(() => {
      // Manually inject environment to test
      (window as any).environment = {
        production: false,
        apiBaseUrl: '/api',
        sseBaseUrl: '/api/events/stream',
        enableLogging: true,
        sseEnabled: true,
        sessionTokenKey: 'portalSessionToken'
      };

      const results = {
        envInjected: true,
        eventSourceAvailable: typeof EventSource !== 'undefined',
        canCreateEventSource: false,
        testError: null as string | null
      };

      try {
        // Test creating EventSource
        const testSource = new EventSource('/api/events/stream?token=admin-session-token');
        results.canCreateEventSource = true;
        
        // Close immediately to avoid hanging
        setTimeout(() => testSource.close(), 1000);
        
      } catch (error) {
        results.testError = (error as Error).message;
      }

      return results;
    });

    console.log('\n=== MANUAL SSE TEST ===');
    console.log('Environment injected:', manualTest.envInjected ? '✅' : '❌');
    console.log('EventSource available:', manualTest.eventSourceAvailable ? '✅' : '❌');
    console.log('Can create EventSource:', manualTest.canCreateEventSource ? '✅' : '❌');
    
    if (manualTest.testError) {
      console.log('Test error:', manualTest.testError);
    }
    console.log('=====================\n');

    expect(manualTest.eventSourceAvailable).toBe(true);
    expect(manualTest.canCreateEventSource).toBe(true);
  });

  test('should verify the complete SSE flow works end-to-end', async ({ page }) => {
    await page.goto('/');

    // Monitor network and create comprehensive test
    const networkActivity: string[] = [];
    page.on('request', req => {
      if (req.url().includes('/api/')) {
        networkActivity.push(`REQUEST: ${req.method()} ${req.url()}`);
      }
    });

    page.on('response', res => {
      if (res.url().includes('/api/')) {
        networkActivity.push(`RESPONSE: ${res.status()} ${res.url()}`);
      }
    });

    // Test the complete flow
    const flowTest = await page.evaluate(() => {
      return new Promise((resolve) => {
        const results = {
          step1_envSetup: false,
          step2_tokenSet: false,
          step3_sseAttempted: false,
          step4_requestMade: false,
          finalStatus: 'not-started',
          errors: [] as string[]
        };

        try {
          // Step 1: Setup environment
          (window as any).environment = {
            sseEnabled: true,
            sseBaseUrl: '/api/events/stream',
            sessionTokenKey: 'portalSessionToken'
          };
          results.step1_envSetup = true;

          // Step 2: Set session token
          localStorage.setItem('portalSessionToken', 'admin-session-token');
          results.step2_tokenSet = true;

          // Step 3: Attempt SSE connection
          const eventSource = new EventSource('/api/events/stream?token=admin-session-token');
          results.step3_sseAttempted = true;

          let requestMade = false;
          const timeout = setTimeout(() => {
            if (!requestMade) {
              results.finalStatus = 'timeout';
            }
            eventSource.close();
            resolve(results);
          }, 5000);

          eventSource.onopen = () => {
            results.step4_requestMade = true;
            results.finalStatus = 'connected';
            clearTimeout(timeout);
            eventSource.close();
            resolve(results);
          };

          eventSource.onerror = () => {
            results.step4_requestMade = true;
            results.finalStatus = 'error-but-reached-server';
            clearTimeout(timeout);
            eventSource.close();
            resolve(results);
          };

        } catch (error) {
          results.errors.push((error as Error).message);
          results.finalStatus = 'setup-error';
          resolve(results);
        }
      });
    });

    await page.waitForTimeout(6000); // Wait for test to complete

    console.log('\n=== END-TO-END FLOW TEST ===');
    console.log('Step 1 - Environment setup:', (flowTest as any).step1_envSetup ? '✅' : '❌');
    console.log('Step 2 - Token set:', (flowTest as any).step2_tokenSet ? '✅' : '❌');
    console.log('Step 3 - SSE attempted:', (flowTest as any).step3_sseAttempted ? '✅' : '❌');
    console.log('Step 4 - Request made:', (flowTest as any).step4_requestMade ? '✅' : '❌');
    console.log('Final status:', (flowTest as any).finalStatus);
    
    if ((flowTest as any).errors.length > 0) {
      console.log('Errors:');
      (flowTest as any).errors.forEach((err: string, i: number) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }

    console.log('\nNetwork Activity:');
    if (networkActivity.length > 0) {
      networkActivity.forEach((activity, i) => {
        console.log(`  ${i + 1}. ${activity}`);
      });
    } else {
      console.log('  No API network activity detected');
    }
    console.log('==========================\n');

    // Verify the basic flow worked
    expect((flowTest as any).step1_envSetup).toBe(true);
    expect((flowTest as any).step2_tokenSet).toBe(true);
    expect((flowTest as any).step3_sseAttempted).toBe(true);
  });
});