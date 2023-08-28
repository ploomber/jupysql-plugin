import { test } from '@jupyterlab/galata';
import { expect } from '@playwright/test';

async function createNewNotebook(page) {
    await page.notebook.createNew("notebok.ipynb");
    await page.notebook.openByPath("notebok.ipynb");
    await page.notebook.activate("notebok.ipynb");
}


async function displayWidget(page) {
    // create notebook
    await createNewNotebook(page);

    // render widget
    await page.notebook.enterCellEditingMode(0);
    const cell = await page.notebook.getCell(0)
    await cell?.type(`
%load_ext sql
%config SqlMagic.dsn_filename = 'connections.ini'
from jupysql_plugin.widgets import ConnectorWidget
ConnectorWidget()`)
    await page.notebook.run()
}

async function createDefaultConnection(page) {
    await displayWidget(page);

    // click on create new connection button and create a new connection
    await page.locator('#createNewConnection').click();
    await page.locator('#createConnectionFormButton').click();
}

test('test displays existing connections', async ({ page }) => {
    await createNewNotebook(page)

    await page.notebook.enterCellEditingMode(0);
    const cell = await page.notebook.getCell(0)
    await cell?.type(`
from pathlib import Path
Path('connections.ini').write_text("""
[first]
drivername = sqlite
database = :memory:

[second]
drivername = sqlite
database = :memory:
""")
%load_ext sql
%config SqlMagic.dsn_filename = 'connections.ini'
from jupysql_plugin.widgets import ConnectorWidget
ConnectorWidget()`)
    await page.notebook.run()

    const connectionsDiv = page.locator('#connectionsButtonsContainer');
    await connectionsDiv.waitFor();

    const childDivs = connectionsDiv.locator('.connection-name');
    expect(await childDivs.count()).toBe(2);

    const firstChildText = await childDivs.nth(0).textContent();
    expect(firstChildText).toBe('first');

    const secondChildText = await childDivs.nth(1).textContent();
    expect(secondChildText).toBe('second');
});



test('test create new connection', async ({ page }) => {
    await createDefaultConnection(page);

    // check that connection is created
    let connectionButton = page.locator('#connBtn_default')
    await connectionButton.waitFor();
    await expect(connectionButton).toContainText('Connected');
    await expect(page.locator('.connection-name')).toContainText('default');

});

test('test create new connection shows error if unable to connect', async ({ page }) => {
    await displayWidget(page);

    // create a new connection with invalid credentials (db isn't running in localhost)
    await page.locator('#createNewConnection').click();
    await page.locator('#selectConnection').selectOption({ label: 'PostgreSQL' });
    await page.locator('#username').fill('someuser');
    await page.locator('#password').fill('somepassword');
    await page.locator('#host').fill('localhost');
    await page.locator('#port').fill('5432');
    await page.locator('#database').fill('somedb');
    await page.locator('#createConnectionFormButton').click();


    // check error message
    await expect(page.locator('.user-error-message')).toContainText('could not connect to server');

    // ensure connection file isn't created
    await page.notebook.addCell("code", "%%sh\ncat connections.ini")
    await page.notebook.runCell(1);

    let output
    output = await page.notebook.getCellTextOutput(1);
    await expect(output[0]).toContain('connections.ini: No such file or directory');

});

test('test delete connection', async ({ page }) => {
    await createDefaultConnection(page);

    // click on delete connection button and confirm
    await page.locator('#deleteConnBtn_default').click();
    await page.locator('#deleteConnectionButton').click();

    expect(page.locator('#connectionsButtonsContainer')).toBeEmpty();

});


test('test edit connection', async ({ page }) => {
    await createDefaultConnection(page);

    // click on edit connection button, edit, and confirm
    await page.locator('#editConnBtn_default').click();
    await page.locator('#database').fill('duck.db');
    await page.locator('#updateConnectionFormButton').click();


    // check that connection is still there
    let connectionButton = page.locator('#connBtn_default')
    await connectionButton.waitFor();
    await expect(connectionButton).toContainText('Connected');
    await expect(page.locator('.connection-name')).toContainText('default');

    await page.notebook.addCell("code", "%%sh\ncat connections.ini")
    await page.notebook.runCell(1);

    let output
    output = await page.notebook.getCellTextOutput(1);
    await expect(output[0]).toContain('database = duck.db');
});


test('test edit connection shows error if unable to connect', async ({ page }) => {
    await createDefaultConnection(page);

    // click on edit connection button, edit, and confirm (with invalid credentials)
    await page.locator('#editConnBtn_default').click();
    await page.locator('#database').fill('path/to/missing/duck.db');
    await page.locator('#updateConnectionFormButton').click();


    // check error message
    await expect(page.locator('.user-error-message')).toContainText('duckdb.IOException');

    // ensure connection file isn't modified
    await page.notebook.addCell("code", "%%sh\ncat connections.ini")
    await page.notebook.runCell(1);

    let output
    output = await page.notebook.getCellTextOutput(1);
    // should still be :memory:
    await expect(output[0]).toContain('database = :memory:');
});



test('test edit connection alias', async ({ page }) => {
    await createDefaultConnection(page);

    // click on edit connection button, edit, and confirm
    await page.locator('#editConnBtn_default').click();
    await page.locator('#connectionName').fill('duckdb');
    await page.locator('#updateConnectionFormButton').click();


    // check that there is only one connection
    let connectionsDiv = page.locator('#connectionsButtonsContainer')
    await connectionsDiv.waitFor();

    const childDivs = connectionsDiv.locator('> div');
    const innerDivCount = await childDivs.count();
    expect(innerDivCount).toBe(1);
});


test('test error if creates connection with existing name', async ({ page }) => {
    await createDefaultConnection(page);

    await page.locator('#createNewConnection').click();
    await page.locator('#connectionName').fill('default');
    await page.locator('#createConnectionFormButton').click();

    await expect(page.locator('.user-error-message')).toContainText('A connection named default already exists in your connections file');
});


test('test error if edit connection with existing name', async ({ page }) => {
    // create default connection
    await createDefaultConnection(page);

    // create a new connection
    await page.locator('#createNewConnection').click();
    await page.locator('#connectionName').fill('duckdb');
    await page.locator('#createConnectionFormButton').click();

    // try to rename it to default, this should fail
    await page.locator('#editConnBtn_duckdb').click();
    await page.locator('#connectionName').fill('default');
    await page.locator('#updateConnectionFormButton').click();


    await expect(page.locator('.user-error-message')).toContainText('A connection named default already exists in your connections file');
});