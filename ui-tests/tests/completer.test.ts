import { IJupyterLabPageFixture, test } from '@jupyterlab/galata';
import { expect } from '@playwright/test';

async function createNotebook(page: IJupyterLabPageFixture) {
  // Create a new Notebook
  await page.menu.clickMenuItem('File>New>Notebook');
  await page.click('button:has-text("Select")');

  // Wait until kernel is ready
  await page.waitForSelector(
    '#jp-main-statusbar >> text=Python 3 (ipykernel) | Idle'
  );
}

const samples = {
  'upper case': {
    input: 'SEL',
    expected: ['SELECT', 'SELECT DISTINCT', 'SELECT INTO', 'SELECT TOP'],
    unexpected: ['INSERT']
  },
  'lower case': {
    input: 'sel',
    expected: ['SELECT', 'SELECT DISTINCT', 'SELECT INTO', 'SELECT TOP'],
    unexpected: ['INSERT']
  },
  'in-word': {
    input: 'se',
    expected: ['SELECT', 'SELECT DISTINCT', 'SELECT INTO', 'SELECT TOP', 'INSERT INTO'],
    unexpected: []
  }
};

for (let sample_name in samples) {
  const sample = samples[sample_name];
  test(`${sample_name} completion`, async ({ page }) => {
    await createNotebook(page);

    // type 'SEL' in the first cell
    await page.notebook.enterCellEditingMode(0);
    await page.keyboard.type(sample.input);

    await page.keyboard.press('Tab');
    const suggestions = page.locator('.jp-Completer');
    await expect(suggestions).toBeVisible();

    for (let suggestion of sample.expected) {
      await expect(suggestions.locator(`code:text-is("${suggestion}")`)).toHaveCount(1);
    }
    for (let suggestion of sample.unexpected) {
      await expect(suggestions.locator(`code:text-is("${suggestion}")`)).toHaveCount(0);
    }
  })
}

test('test complete updates cell', async ({ page }) => {
  await createNotebook(page);

  await page.notebook.enterCellEditingMode(0);
  await page.keyboard.type('SEL');

  await page.keyboard.press('Tab');

  // delay to ensure the autocompletion options are displayed
  await page.waitForSelector(".jp-Completer-list");
  await page.keyboard.press('Enter');

  const cell_updated = await page.notebook.getCell(0);
  cell_updated?.innerText().then((text) => {
      expect(text).toContain('SELECT');
  });

});
