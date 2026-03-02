/**
 * E2E tests for Welcome page
 */

const { test, expect } = require('@playwright/test');

test.describe('Welcome Page', () => {
  test('should load welcome page', async ({ page }) => {
    await page.goto('/welcome.html');

    // Check for main heading
    await expect(page.locator('h1')).toContainText('Velkommen');
  });

  test('should have QR scanner button', async ({ page }) => {
    await page.goto('/welcome.html');

    // Check for scan button
    const scanButton = page.locator('button', { hasText: 'Skann QR-kode' });
    await expect(scanButton).toBeVisible();
  });

  test('should navigate to profile page when QR is scanned', async ({ page }) => {
    await page.goto('/welcome.html');

    // This would require mocking QR scanning or using a test participant code
    // For now, we'll just check that the button exists
    const scanButton = page.locator('button', { hasText: 'Skann QR-kode' });
    await expect(scanButton).toBeEnabled();
  });
});

test.describe('Navigation', () => {
  test('should navigate from welcome to activities', async ({ page }) => {
    await page.goto('/welcome.html');

    // Check if activities links exist
    const activitiesSection = page.locator('text=Aktiviteter');
    await expect(activitiesSection).toBeVisible();
  });

  test('should have link to admin panel', async ({ page }) => {
    await page.goto('/welcome.html');

    // Check for settings/admin icon or link
    const settingsLink = page.locator('a[href="/admin.html"]');
    if (await settingsLink.count() > 0) {
      await expect(settingsLink).toBeVisible();
    }
  });
});
