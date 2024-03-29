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
    input: '%sql SEL',
    expected: ['SELECT', 'SELECT DISTINCT', 'SELECT INTO', 'SELECT TOP'],
    unexpected: ['INSERT']
  },
  'lower case': {
    input: '%sql sel',
    expected: ['SELECT', 'SELECT DISTINCT', 'SELECT INTO', 'SELECT TOP'],
    unexpected: ['INSERT']
  },
  'in-word': {
    input: '%sql se',
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
  await page.keyboard.type('%sql SEL');

  await page.keyboard.press('Tab');

  // delay to ensure the autocompletion options are displayed
  await page.waitForSelector(".jp-Completer-list");
  await page.keyboard.press('Enter');

  const cell_updated = await page.notebook.getCell(0);
  cell_updated?.innerText().then((text) => {
      expect(text).toContain('SELECT');
  });

});

const contexts = {
  'valid cell magic': {
    input: '%%sql\nSEL',
    completion: true
  },
  'invalid cell magic': {
    input: ' %%sql\nSEL',
    completion: false
  },
  'line magic': {
    input: '%sql SEL',
    completion: true
  },
  'line magic with python': {
    input: 'result = %sql SEL',
    completion: true
  },
  'line magic new line': {
    input: '%sql SEL\nSEL',
    completion: false
  },
  'no magic': {
    input: 'SEL',
    completion: false
  }
}

for (const [ name, { input, completion} ] of Object.entries(contexts))
  test(`test ${name} ${completion ? 'does' : 'does not'} complete`, async ({ page }) => {
    await createNotebook(page);

    await page.notebook.enterCellEditingMode(0);
    await page.keyboard.type(input);

    await page.keyboard.press('Tab');
    const suggestions = page.locator('.jp-Completer');
    if (completion)
      await expect(suggestions).toBeVisible();
    else
      await expect(suggestions).not.toBeVisible();
  });

test('test no completion before line magic', async ({ page }) => {
  await createNotebook(page);

  await page.notebook.enterCellEditingMode(0);
  await page.keyboard.type('SEL = %sql SEL');
  for (let i=0; i<11; i++)
    await page.keyboard.press('ArrowLeft');

  await page.keyboard.press('Tab');
  const suggestions = page.locator('.jp-Completer');
  await expect(suggestions).not.toBeVisible();
});
