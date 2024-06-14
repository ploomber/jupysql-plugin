import { test } from '@jupyterlab/galata';
import { expect } from '@playwright/test';

test('test format SQL', async ({ page }) => {
    await page.notebook.createNew("sample.ipynb");
    await page.notebook.openByPath("sample.ipynb");
    await page.notebook.activate("sample.ipynb");
    await page.notebook.addCell("code", "%%sql\nselect * from table")
    await page.getByTestId('format-btn').locator('button').click({ force: true });
    await page.waitForTimeout(5000);

    await expect(page.locator('body')).toContainText('SELECT');
    await expect(page.locator('body')).toContainText('FROM');
});