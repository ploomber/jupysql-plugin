import { test } from '@jupyterlab/galata';
import { expect } from '@playwright/test';

test('test prompt user for api key', async ({ page }) => {
    await page.notebook.createNew("sample.ipynb");
    await page.notebook.openByPath("sample.ipynb");
    await page.notebook.activate("sample.ipynb");
    await page.getByTestId('share-btn').locator('button').click();

    await expect(page.locator('.jp-Dialog')).toContainText('You need an API key to upload this notebook');
});