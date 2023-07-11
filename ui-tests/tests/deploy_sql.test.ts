import { test } from '@jupyterlab/galata';
import { expect } from '@playwright/test';

test('test deploy notebook', async ({ page }) => {
    await page.notebook.createNew("sample.ipynb");
    await page.notebook.openByPath("sample.ipynb");
    await page.notebook.activate("sample.ipynb");
    await page.notebook.addCell("code", "%%sql\nselect * from table")
    await page.getByTestId('format-btn').locator('button').click();
    await page.waitForTimeout(2000);


});