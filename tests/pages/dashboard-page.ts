import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly userInfo: Locator;
  readonly userIdDisplay: Locator;
  readonly userRoleDisplay: Locator;
  readonly logoutButton: Locator;
  readonly navigationMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1').first();
    this.userInfo = page.locator('.user-info');
    this.userIdDisplay = page.locator('.user-id');
    this.userRoleDisplay = page.locator('.user-role');
    this.logoutButton = page.locator('button:has-text("Sign Out")');
    this.navigationMenu = page.locator('nav');
  }

  async expectToBeOnDashboard() {
    await expect(this.page).toHaveURL(/\/dashboard/);
    // Wait for the page to be fully loaded, but don't wait for networkidle as it may timeout
    // Instead, wait for a key element to be visible
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
  }

  async expectUserInfo(userId: string, role: string) {
    await expect(this.userIdDisplay).toContainText(userId);
    await expect(this.userRoleDisplay).toContainText(role.replace(/([A-Z])/g, ' $1').trim().toUpperCase());
  }

  async logout() {
    await this.logoutButton.click();
  }

  async expectNavigationForRole(role: string) {
    // Check that appropriate navigation items are visible based on role
    if (role === 'InternalSupport') {
      // Internal support should see audit link
      await expect(this.page.locator('a[href="/audit"]')).toBeVisible();
    }
    // All roles should see dashboard, files, keys, sftp
    await expect(this.page.locator('a[href="/dashboard"]')).toBeVisible();
    await expect(this.page.locator('a[href="/files"]')).toBeVisible();
    await expect(this.page.locator('a[href="/keys"]')).toBeVisible();
    await expect(this.page.locator('a[href="/sftp"]')).toBeVisible();
  }
}