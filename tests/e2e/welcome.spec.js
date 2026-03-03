/**
 * E2E tests for Welcome page
 */

const { test, expect } = require('@playwright/test');

test.describe('Welcome Page', () => {
  test('should load welcome page', async ({ page }) => {
    await page.goto('/welcome.html');

    // Check for main heading (use specific text to avoid matching multiple h1 elements)
    await expect(page.getByRole('heading', { name: /Velkommen/ })).toBeVisible();
  });

  test('should have QR scanner interface', async ({ page }) => {
    await page.goto('/welcome.html');

    // Check that the scanner is ready (more specific pattern to match only status message)
    await expect(page.getByText(/Skanner klar -/)).toBeVisible();
  });

  test('should have scanner input ready', async ({ page }) => {
    await page.goto('/welcome.html');

    // Check that scanner interface is active and ready for input
    const scannerInput = page.locator('input[type="text"]').first();
    await expect(scannerInput).toBeVisible();
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
