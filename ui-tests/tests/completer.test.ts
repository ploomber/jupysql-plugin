import { test } from '@jupyterlab/galata';
import { expect } from '@playwright/test';

test('test options displayed on tab', async ({ page }) => {
    await page.notebook.createNew("sample.ipynb");
    await page.notebook.openByPath("sample.ipynb");
    await page.notebook.activate("sample.ipynb");
    await page.notebook.enterCellEditingMode(0);
    const cell = await page.notebook.getCell(0)
    await cell?.type('%%sql\nsel')
    await page.keyboard.press('Tab');

    // delay to ensure the autocompletion options are displayed
    await page.waitForSelector(".jp-Completer-list")

    await expect(page.locator('.jp-Completer-list')).toContainText('SELECT');
    await expect(page.locator('.jp-Completer-list')).toContainText('SELECT DISTINCT');
    await expect(page.locator('.jp-Completer-list')).toContainText('SELECT INTO');
    await expect(page.locator('.jp-Completer-list')).toContainText('SELECT TOP');
});



test('test complete updates cell', async ({ page }) => {
    await page.notebook.createNew("sample.ipynb");
    await page.notebook.openByPath("sample.ipynb");
    await page.notebook.activate("sample.ipynb");
    await page.notebook.enterCellEditingMode(0);
    const cell = await page.notebook.getCell(0)
    await cell?.type('%%sql\nsel')
    await page.keyboard.press('Tab')

    // delay to ensure the autocompletion options are displayed
    await page.waitForSelector(".jp-Completer-list")
    await page.keyboard.press('Enter');

    const cell_updated = await page.notebook.getCell(0)
    cell_updated?.innerText().then((text) => {
        expect(text).toContain('SELECT');
    });

});

