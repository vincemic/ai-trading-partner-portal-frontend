import { Page, Locator, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly partnerSelect: Locator;
  readonly userIdInput: Locator;
  readonly roleSelect: Locator;
  readonly loginButton: Locator;
  readonly errorBanner: Locator;
  readonly loadingSpinner: Locator;
  readonly loginTitle: Locator;
  readonly demoNotice: Locator;

  constructor(page: Page) {
    this.page = page;
    this.partnerSelect = page.locator('#partner');
    this.userIdInput = page.locator('#userId');
    this.roleSelect = page.locator('#role');
    this.loginButton = page.locator('button[type="submit"]');
    this.errorBanner = page.locator('.error-banner');
    this.loadingSpinner = page.locator('.loading-spinner');
    this.loginTitle = page.locator('.login-title');
    this.demoNotice = page.locator('.demo-notice');
  }

  async goto() {
    await this.page.goto('/login');
    await expect(this.loginTitle).toHaveText('Point C Health Trading Portal');
  }

  async selectPartner(partner: string) {
    await this.partnerSelect.selectOption(partner);
  }

  async enterUserId(userId: string) {
    await this.userIdInput.fill(userId);
  }

  async selectRole(role: string) {
    await this.roleSelect.selectOption(role);
  }

  async clickLogin() {
    await this.loginButton.click();
  }

  async login(partner: string, userId: string, role: string) {
    await this.selectPartner(partner);
    await this.enterUserId(userId);
    await this.selectRole(role);
    await this.clickLogin();
  }

  async waitForLoginToComplete() {
    // Wait for loading spinner to disappear or navigation to occur
    await Promise.race([
      this.page.waitForURL(/\/dashboard/, { timeout: 10000 }),
      this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 }),
    ]);
  }

  async expectToBeOnLoginPage() {
    await expect(this.page).toHaveURL(/\/login/);
    await expect(this.loginTitle).toBeVisible();
  }

  async expectErrorMessage(message?: string) {
    await expect(this.errorBanner).toBeVisible();
    if (message) {
      await expect(this.errorBanner).toContainText(message);
    }
  }

  async expectSuccessfulRedirectToDashboard() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  async expectFormValidationErrors() {
    // Check if any form fields have error styling
    const hasErrors = await this.page.locator('.form-input.error').count();
    expect(hasErrors).toBeGreaterThan(0);
  }

  async isLoginButtonDisabled() {
    return await this.loginButton.isDisabled();
  }

  async getPartnerOptions() {
    return await this.partnerSelect.locator('option').allTextContents();
  }

  async getRoleOptions() {
    return await this.roleSelect.locator('option').allTextContents();
  }
}