import { test, expect } from '@playwright/test';

test.describe('Dashboard Proxy Fix', () => {
  test('should load dashboard with working proxy', async ({ page }) => {
    // Go to login page
    await page.goto('/');
    
    // Select organization and role
    await page.selectOption('select[name="partner"]', 'acme');
    await page.selectOption('select[name="role"]', 'PartnerAdmin');
    
    // Fill in email and login
    await page.fill('input[name="email"]', 'admin@acme.com');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');
    
    // Wait for dashboard to load (give it more time)
    await page.waitForTimeout(5000);
    
    // Check that we're on the dashboard
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check for successful data loading by looking for KPI tiles or data
    const dashboardContent = page.locator('[data-testid="dashboard-container"]');
    await expect(dashboardContent).toBeVisible();
    
    // Check that error state is not visible
    const errorState = page.locator('text=Failed to load dashboard');
    await expect(errorState).not.toBeVisible();
    
    // Check for actual data - look for numbers or metrics
    const hasData = await page.locator('text=/\\d+/').first().isVisible();
    expect(hasData).toBe(true);
    
    console.log('✅ Dashboard loaded successfully with data!');
  });
  
  test('should make successful API calls through proxy', async ({ page }) => {
    const apiRequests: any[] = [];
    const apiResponses: any[] = [];
    
    // Listen for API requests
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });
    
    // Listen for API responses
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          contentType: response.headers()['content-type']
        });
      }
    });
    
    // Login and navigate to dashboard
    await page.goto('/');
    await page.selectOption('select[name="partner"]', 'acme');
    await page.selectOption('select[name="role"]', 'PartnerAdmin');
    await page.fill('input[name="email"]', 'admin@acme.com');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    
    // Wait for API calls to complete
    await page.waitForTimeout(3000);
    
    console.log('API Requests:', apiRequests);
    console.log('API Responses:', apiResponses);
    
    // Verify API calls were made
    expect(apiRequests.length).toBeGreaterThan(0);
    expect(apiResponses.length).toBeGreaterThan(0);
    
    // Verify all API responses are successful and return JSON
    for (const response of apiResponses) {
      expect(response.status).toBe(200);
      expect(response.contentType).toContain('application/json');
    }
    
    console.log('✅ All API calls successful with JSON responses!');
  });
});