import { test, expect } from '@playwright/test';
import { LoginPage } from './pages';

test.describe('Dashboard Debug Tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test('should load dashboard with actual data visible', async ({ page }) => {
    // Navigate to login
    await page.goto('/login');
    
    // Login as admin user
    await loginPage.login('11111111-1111-1111-1111-111111111111', 'test-user@acme.com', 'PartnerAdmin');
    
    // Wait for dashboard redirect
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Check if KPI tiles are present
    await expect(page.locator('.kpi-grid')).toBeVisible({ timeout: 10000 });
    
    // Check if any data is displayed (not just loading state)
    const kpiTiles = page.locator('.kpi-tile');
    await expect(kpiTiles).toHaveCount(6); // Should have 6 KPI tiles
    
    // Check specific data values
    const filesToday = page.locator('.kpi-tile').first().locator('.kpi-value');
    await expect(filesToday).toBeVisible();
    
    // Get the actual text content to see what's being displayed
    const filesTodayText = await filesToday.textContent();
    console.log('Files Today value:', filesTodayText);
    
    // Check for non-zero values or "N/A" placeholders
    const successRate = page.locator('.kpi-tile').nth(1).locator('.kpi-value');
    const successRateText = await successRate.textContent();
    console.log('Success Rate value:', successRateText);
    
    // Check for error states
    const errorState = page.locator('.error-state');
    const hasError = await errorState.isVisible();
    console.log('Has error state:', hasError);
    
    if (hasError) {
      const errorText = await errorState.textContent();
      console.log('Error message:', errorText);
    }
    
    // Check loading state
    const loadingState = page.locator('.loading-state');
    const isLoading = await loadingState.isVisible();
    console.log('Is loading:', isLoading);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'dashboard-debug-screenshot.png', fullPage: true });
    
    // Check browser console for errors
    const logs: string[] = [];
    page.on('console', msg => logs.push(msg.text()));
    
    // Wait a bit more to see if data loads
    await page.waitForTimeout(3000);
    
    console.log('Console logs:', logs);
    
    // Basic assertion that we're not stuck in loading state
    await expect(loadingState).not.toBeVisible();
  });

  test('should check network requests for dashboard data', async ({ page }) => {
    const responses: Array<{url: string, status: number, statusText: string}> = [];
    const requests: Array<{url: string, method: string, headers: Record<string, string>}> = [];

    // Track network activity
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // Navigate and login
    await page.goto('/login');
    await loginPage.login('11111111-1111-1111-1111-111111111111', 'test-user@acme.com', 'PartnerAdmin');
    
    // Wait for dashboard to load
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForTimeout(5000); // Give time for API calls
    
    console.log('API Requests made:', requests);
    console.log('API Responses received:', responses);
    
    // Check if dashboard API was called
    const dashboardRequest = requests.find(req => req.url.includes('/dashboard/summary'));
    expect(dashboardRequest).toBeTruthy();
    console.log('Dashboard request:', dashboardRequest);
    
    // Check if requests had session tokens
    if (dashboardRequest) {
      expect(dashboardRequest.headers['x-session-token']).toBeTruthy();
      console.log('Session token present:', !!dashboardRequest.headers['x-session-token']);
    }
    
    // Check for successful responses
    const dashboardResponse = responses.find(res => res.url.includes('/dashboard/summary'));
    if (dashboardResponse) {
      expect(dashboardResponse.status).toBe(200);
      console.log('Dashboard API response status:', dashboardResponse.status);
    }
  });
});