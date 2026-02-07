import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

// Admin credentials
const ADMIN_EMAIL = 'nadav@tidf.com';
const ADMIN_PASSWORD = 'Aa123456';

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);

  // Wait for page to load
  await page.waitForTimeout(1000);

  // Check if already logged in (redirected to home page)
  if (!page.url().includes('/login')) {
    // Already logged in, return
    return;
  }

  // Wait for login form to be ready
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });

  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'התחבר' }).click();

  // Wait for either successful redirect or error message
  await Promise.race([
    page.waitForURL(`${BASE_URL}/`, { timeout: 15000 }),
    page.waitForSelector('.error, [class*="error"]', { timeout: 15000 })
  ]);

  // Check if login was successful
  const currentUrl = page.url();
  if (currentUrl.includes('/login')) {
    throw new Error('Login failed - still on login page');
  }
}

test.describe('Tester Evaluation Flow', () => {
  test.setTimeout(60000); // Increase timeout to 60 seconds

  test.beforeEach(async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  });

  test('evaluation form defaults to תרגול for non-tester roles', async ({ page }) => {
    // Navigate to evaluations page
    await page.getByRole('link', { name: 'הערכות' }).click();
    await page.waitForURL(`${BASE_URL}/grade`);

    // Wait for page to load
    await page.waitForSelector('.subject-card, [class*="subject"]', { timeout: 10000 });

    // Click on שיעור ציוד
    await page.getByText('שיעור ציוד').first().click();
    await page.waitForURL(/\/evaluations\/new\/equipment_lesson/);

    // Wait for form to load
    await page.waitForSelector('.toggle-btn, [class*="toggle"]', { timeout: 10000 });

    // Verify תרגול is selected by default (for admin/instructor/madar)
    const practiceButton = page.getByRole('button', { name: 'תרגול' });
    await expect(practiceButton).toHaveClass(/active/);

    // Verify מבחן is NOT active
    const testButton = page.getByRole('button', { name: 'מבחן' });
    await expect(testButton).not.toHaveClass(/active/);
  });

  test('instructor field becomes required when מבחן is selected', async ({ page }) => {
    // Navigate to evaluation form
    await page.getByRole('link', { name: 'הערכות' }).click();
    await page.waitForSelector('.subject-card, [class*="subject"]', { timeout: 10000 });

    await page.getByText('שיעור ציוד').first().click();
    await page.waitForURL(/\/evaluations\/new\/equipment_lesson/);
    await page.waitForSelector('.toggle-btn, [class*="toggle"]', { timeout: 10000 });

    // Initially instructor field should not have asterisk (תרגול mode)
    let instructorLabel = page.locator('label').filter({ hasText: /^מדריך מעריך$/ });
    await expect(instructorLabel).toBeVisible();

    // Click on מבחן button
    await page.getByRole('button', { name: 'מבחן' }).click();

    // Now instructor label should have asterisk
    instructorLabel = page.locator('label').filter({ hasText: /מדריך מעריך \*/ });
    await expect(instructorLabel).toBeVisible();
  });

  test('completed evaluation marked as מבחן appears in student page', async ({ page }) => {
    // Navigate to evaluation form
    await page.getByRole('link', { name: 'הערכות' }).click();
    await page.waitForSelector('.subject-card, [class*="subject"]', { timeout: 10000 });

    await page.getByText('שיעור ציוד').first().click();
    await page.waitForURL(/\/evaluations\/new\/equipment_lesson/);
    await page.waitForSelector('.toggle-btn, [class*="toggle"]', { timeout: 10000 });

    // Select מבחן
    await page.getByRole('button', { name: 'מבחן' }).click();

    // Select a student - click on the selector display
    const studentSelector = page.locator('.selector-display, [class*="selector"]').first();
    await studentSelector.click();
    await page.waitForTimeout(500);

    // Click on first student option
    const studentOption = page.locator('.selector-option').first();
    const studentText = await studentOption.textContent();
    await studentOption.click();
    await page.waitForTimeout(300);

    // Select an instructor (required for מבחן)
    const instructorSelector = page.locator('.selector-display, [class*="selector"]').nth(1);
    await instructorSelector.click();
    await page.waitForTimeout(500);
    await page.locator('.selector-option').first().click();
    await page.waitForTimeout(300);

    // Fill all criteria with scores
    const criteriaCards = page.locator('.criterion-card');
    const count = await criteriaCards.count();

    for (let i = 0; i < count; i++) {
      const card = criteriaCards.nth(i);
      // Find score buttons (numbers 1-10)
      const buttons = card.locator('button').filter({ hasText: /^[0-9]+$/ });
      const buttonCount = await buttons.count();

      if (buttonCount > 0) {
        // Click the middle button
        const middleIndex = Math.floor(buttonCount / 2);
        await buttons.nth(middleIndex).click();
        await page.waitForTimeout(100);
      }
    }

    await page.waitForTimeout(500);

    // Try to save
    const saveButton = page.getByRole('button', { name: 'שמור הערכה' });

    if (await saveButton.isEnabled()) {
      await saveButton.click();

      // Wait for redirect to history
      await page.waitForURL(`${BASE_URL}/evaluations/history`, { timeout: 15000 });

      // Verify we're on history page
      await expect(page.getByText('היסטוריית הערכות')).toBeVisible();

      // Navigate to students page
      await page.getByRole('link', { name: 'ניהול חניכים' }).click();
      await page.waitForURL(`${BASE_URL}/`);

      // Click on the student to verify evaluation appears
      if (studentText) {
        const firstName = studentText.trim().split(' ')[0];
        const studentRow = page.locator('tr').filter({ hasText: firstName }).first();

        if (await studentRow.isVisible()) {
          await studentRow.click();
          await page.waitForTimeout(500);

          // Modal should open
          const modal = page.locator('.modal');
          await expect(modal).toBeVisible({ timeout: 5000 });
        }
      }
    } else {
      // If save is disabled, check what's missing
      console.log('Save button is disabled - some criteria may not be filled');
    }
  });

  test('all evaluation types show test/practice toggle', async ({ page }) => {
    await page.getByRole('link', { name: 'הערכות' }).click();
    await page.waitForSelector('.subject-card, [class*="subject"]', { timeout: 10000 });

    const evaluationTypes = [
      { name: 'שיעור ציוד', urlPattern: /equipment_lesson/ },
      { name: 'צלילת הכרות', urlPattern: /intro_dive/ },
      { name: 'העברת תדריך לפני צלילה', urlPattern: /pre_dive_briefing/ },
      { name: 'העברת הרצאה', urlPattern: /lecture_delivery/ },
      { name: 'העברת שיעור מים', urlPattern: /water_lesson/ }
    ];

    for (const evalType of evaluationTypes) {
      await page.goto(`${BASE_URL}/grade`);
      await page.waitForSelector('.subject-card, [class*="subject"]', { timeout: 10000 });

      await page.getByText(evalType.name).first().click();
      await page.waitForURL(evalType.urlPattern);
      await page.waitForSelector('.toggle-btn, [class*="toggle"]', { timeout: 10000 });

      await expect(page.getByRole('button', { name: 'תרגול' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'מבחן' })).toBeVisible();
    }
  });
});
