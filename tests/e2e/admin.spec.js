/**
 * E2E tests for Admin panel
 */

const { test, expect } = require('@playwright/test');

test.describe('Admin Panel - Authentication', () => {
  test('should show authentication modal on first visit', async ({ page }) => {
    await page.goto('/admin.html');

    // Check if auth modal is visible
    const authModal = page.locator('#authModal');
    await expect(authModal).toBeVisible();
  });

  test('should have QR and PIN auth options', async ({ page }) => {
    await page.goto('/admin.html');

    // Check for auth tabs
    const qrAuthTab = page.locator('text=QR-kode');
    const pinAuthTab = page.locator('text=PIN-kode');

    await expect(qrAuthTab).toBeVisible();
    await expect(pinAuthTab).toBeVisible();
  });
});

test.describe('Admin Panel - Tabs', () => {
  test.skip('should display all main tabs', async ({ page }) => {
    // Skip this test initially as it requires authentication
    await page.goto('/admin.html');

    // After authentication, these tabs should be visible
    const tabs = [
      'Arrangement',
      'Lag',
      'Deltakere',
      'Kurs',
      'Soverom'
    ];

    for (const tabName of tabs) {
      const tab = page.locator(`.tab-button:has-text("${tabName}")`);
      await expect(tab).toBeVisible();
    }
  });
});

test.describe('Admin Panel - Sleeping Rooms', () => {
  test.skip('should show sleeping rooms management', async ({ page }) => {
    // Skip initially - requires auth
    await page.goto('/admin.html');

    // Click on sleeping rooms tab
    await page.click('button:has-text("Soverom")');

    // Check for room management section
    const roomSection = page.locator('text=Soverom & Beleggsstatistikk');
    await expect(roomSection).toBeVisible();

    // Check for add room button
    const addRoomBtn = page.locator('button:has-text("Nytt Soverom")');
    await expect(addRoomBtn).toBeVisible();
  });
});

test.describe('Admin Panel - Participants', () => {
  test.skip('should show participants list with filters', async ({ page }) => {
    // Skip initially - requires auth
    await page.goto('/admin.html');

    // Click on participants tab
    await page.click('button:has-text("Deltakere")');

    // Check for filter dropdown
    const filterDropdown = page.locator('#confirmationFilter');
    await expect(filterDropdown).toBeVisible();

    // Check for print button
    const printBtn = page.locator('button:has-text("Skriv ut liste")');
    await expect(printBtn).toBeVisible();
  });

  test.skip('should filter participants by room assignment', async ({ page }) => {
    // Skip initially - requires auth
    await page.goto('/admin.html');

    // Click on participants tab
    await page.click('button:has-text("Deltakere")');

    // Select "no room" filter
    await page.selectOption('#confirmationFilter', 'no-room');

    // Verify filter is applied
    const filterStats = page.locator('#filterStats');
    await expect(filterStats).toContainText('uten rom');
  });
});

test.describe('Admin Panel - Print Functionality', () => {
  test.skip('should open participant print report', async ({ page, context }) => {
    // Skip initially - requires auth
    await page.goto('/admin.html');

    // Click on participants tab
    await page.click('button:has-text("Deltakere")');

    // Listen for new page (print window)
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.click('button:has-text("Skriv ut liste")')
    ]);

    // Verify the print report page opened
    await expect(newPage).toHaveURL(/participant-report\.html/);

    // Verify report content
    const reportTitle = newPage.locator('h1');
    await expect(reportTitle).toContainText('Deltakerliste');
  });
});
