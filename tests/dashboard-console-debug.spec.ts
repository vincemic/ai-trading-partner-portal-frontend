import { test, expect } from '@playwright/test';
import { LoginPage } from './pages';

test.describe('Dashboard Console Debug', () => {
  test('should capture console logs during dashboard load', async ({ page }) => {
    const logs: string[] = [];
    const errors: string[] = [];

    // Capture console output
    page.on('console', msg => {
      const text = msg.text();
      logs.push(`${msg.type()}: ${text}`);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });

    // Capture uncaught errors
    page.on('pageerror', error => {
      errors.push(`Uncaught error: ${error.message}`);
    });

    const loginPage = new LoginPage(page);
    
    // Navigate and login
    await page.goto('/login');
    await loginPage.login('11111111-1111-1111-1111-111111111111', 'test-user@acme.com', 'PartnerAdmin');
    
    // Wait for dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Wait a bit for all async operations
    await page.waitForTimeout(5000);
    
    // Check what's actually on the page
    const body = await page.locator('body').textContent();
    console.log('Page content:', body);
    
    // Check for specific dashboard elements
    const dashboardContainer = page.locator('.dashboard-container');
    const hasDashboardContainer = await dashboardContainer.isVisible();
    console.log('Has dashboard container:', hasDashboardContainer);
    
    const loadingState = page.locator('.loading-state');
    const isLoading = await loadingState.isVisible();
    console.log('Is in loading state:', isLoading);
    
    const errorState = page.locator('.error-state');
    const hasError = await errorState.isVisible();
    console.log('Has error state:', hasError);
    
    if (hasError) {
      const errorText = await errorState.textContent();
      console.log('Error state text:', errorText);
    }
    
    // Log all captured output
    console.log('Console logs:', logs);
    console.log('JavaScript errors:', errors);
    
    // Take screenshot
    await page.screenshot({ path: 'dashboard-console-debug.png', fullPage: true });
    
    // Basic assertion - let's be less strict for debugging
    // expect(errors.length).toBe(0); // Should have no JavaScript errors
    console.log('Total errors found:', errors.length);
  });
});