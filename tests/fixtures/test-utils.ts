import { Page } from '@playwright/test';
import { LoginPage, DashboardPage } from '../pages';
import { UserCredentials } from './test-data';

/**
 * Utility function to perform a complete login flow
 */
export async function loginAsUser(page: Page, user: UserCredentials): Promise<void> {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(user.partner, user.userId, user.role);
  await loginPage.waitForLoginToComplete();
}

/**
 * Utility function to logout the current user
 */
export async function logout(page: Page): Promise<void> {
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.logout();
}

/**
 * Utility function to verify user is logged in and on dashboard
 */
export async function verifyUserOnDashboard(page: Page, user: UserCredentials): Promise<void> {
  const dashboardPage = new DashboardPage(page);
  await dashboardPage.expectToBeOnDashboard();
  await dashboardPage.expectUserInfo(user.userId, user.role);
}

/**
 * Helper to clear all browser storage and cookies
 */
export async function clearSession(page: Page): Promise<void> {
  await page.evaluate(() => {
    sessionStorage.clear();
    localStorage.clear();
  });
  await page.context().clearCookies();
}

/**
 * Helper to wait for page to be fully loaded
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Helper to take a screenshot with a descriptive name
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true 
  });
}

/**
 * Utility to verify form validation states
 */
export async function verifyFormValidation(page: Page, expectedErrors: string[]): Promise<void> {
  for (const error of expectedErrors) {
    await page.locator('.form-error').filter({ hasText: error }).waitFor({ state: 'visible' });
  }
}