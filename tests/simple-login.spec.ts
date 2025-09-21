import { test, expect } from '@playwright/test';

test.describe('Simple Login Test', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/Trading Partner Portal/);
    await expect(page.locator('h1')).toContainText('PointC Trading Portal');
  });

  test('should show login form elements', async ({ page }) => {
    await page.goto('/login');
    
    // Check form elements are visible
    await expect(page.locator('#partner')).toBeVisible();
    await expect(page.locator('#userId')).toBeVisible();
    await expect(page.locator('#role')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should be able to fill form and login', async ({ page }) => {
    await page.goto('/login');
    
    // Fill the form
    await page.selectOption('#partner', '11111111-1111-1111-1111-111111111111');
    await page.fill('#userId', 'test-user@acme.com');
    await page.selectOption('#role', 'PartnerUser');
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });
});