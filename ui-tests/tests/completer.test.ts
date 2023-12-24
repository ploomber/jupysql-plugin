import { test } from '@jupyterlab/galata';
import { expect } from '@playwright/test';

test('test completion', async ({ page }) => {
  // Create a new Notebook
  await page.menu.clickMenuItem('File>New>Notebook');
  await page.click('button:has-text("Select")');

  // Wait until kernel is ready
  await page.waitForSelector(
    '#jp-main-statusbar >> text=Python 3 (ipykernel) | Idle'
  );

  // type 'SEL' in the first cell
  await page.notebook.enterCellEditingMode(0);
  await page.keyboard.type('SEL');

  await page.keyboard.press('Tab');
  const suggestions = page.locator('.jp-Completer');
  await expect(suggestions).toBeVisible();
  await expect(suggestions.locator('code:text-is("SELECT")')).toHaveCount(1);
  await expect(suggestions.locator('code:text-is("INSERT")')).toHaveCount(0);
});

test('lower case completion', async ({ page }) => {
  // Create a new Notebook
  await page.menu.clickMenuItem('File>New>Notebook');
  await page.click('button:has-text("Select")');

  // Wait until kernel is ready
  await page.waitForSelector(
    '#jp-main-statusbar >> text=Python 3 (ipykernel) | Idle'
  );

  // type 'sel' in the first cell
  await page.notebook.enterCellEditingMode(0);
  await page.keyboard.type('sel');

  await page.keyboard.press('Tab');
  const suggestions = page.locator('.jp-Completer');
  await expect(suggestions).toBeVisible();
  await expect(suggestions.locator('code:text-is("SELECT")')).toHaveCount(1);
});

test('in-word suggestion', async ({ page }) => {
  // Create a new Notebook
  await page.menu.clickMenuItem('File>New>Notebook');
  await page.click('button:has-text("Select")');

  // Wait until kernel is ready
  await page.waitForSelector(
    '#jp-main-statusbar >> text=Python 3 (ipykernel) | Idle'
  );

  // type 'se' in the first cell
  await page.notebook.enterCellEditingMode(0);
  await page.keyboard.type('se');

  await page.keyboard.press('Tab');
  const suggestions = page.locator('.jp-Completer');
  await expect(suggestions).toBeVisible();
  await expect(suggestions.locator('code:text-is("INSERT INTO")')).toHaveCount(1);
});
