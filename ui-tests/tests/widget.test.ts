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


const relevantFieldsEmbeddedDatabases = [
  { label: 'DuckDB', connectionName: 'default', database: ':memory:'},
  { label: 'SQLite', connectionName: 'default', database: ':memory:'}
  ]

for (const { label, connectionName, database } of relevantFieldsEmbeddedDatabases) {
    test(`test only relevant fields appear in embedded database ${label}`, async ({ page }) => {
        await displayWidget(page);

        await page.locator('#createNewConnection').click();
        await page.locator('#selectConnection').selectOption({ label: label });

        expect(await page.locator('#connectionName').evaluate(select => select.value)).toBe(connectionName);

        expect(await page.locator('#database').evaluate(select => select.value)).toBe(database);

        const username = page.locator('#username');
        expect(await username.count()).toBe(0);

        const password = page.locator('#password');
        expect(await password.count()).toBe(0);

        const host = page.locator('#host');
        expect(await host.count()).toBe(0);

    });
}

const fieldDefaultsWhenNoExistingConnection = [
  { label: 'PostgreSQL', connectionName: 'default', port: '5432', username: "", password: "", host: "", database: ""},
  { label: 'MySQL', connectionName: 'default', port: '3306', username: "", password: "", host: "", database: ""},
  { label: 'MariaDB', connectionName: 'default', port: '3306', username: "", password: "", host: "", database: ""},
  { label: 'Snowflake', connectionName: 'default', port: '443', username: "", password: "", host: "", database: ""},
  { label: 'Oracle', connectionName: 'default', port: '1521', username: "", password: "", host: "", database: ""},
  { label: 'MSSQL',connectionName: 'default',  port: '1433', username: "", password: "", host: "", database: ""},
  { label: 'Redshift', connectionName: 'default', port: '5439', username: "", password: "", host: "", database: ""},

];

for (const { label, connectionName, database, port, username, password, host } of fieldDefaultsWhenNoExistingConnection) {
    test(`test field defaults appear if there is no existing connection : ${label}`, async ({ page }) => {
        await displayWidget(page);

        await page.locator('#createNewConnection').click();
        await page.locator('#selectConnection').selectOption({ label: label });

        expect(await page.locator(`#connectionName`).evaluate(select => select.value)).toBe(connectionName);
        expect(await page.locator(`#port`).evaluate(select => select.value)).toBe(port);
        expect(await page.locator(`#username`).evaluate(select => select.value)).toBe(username);
        expect(await page.locator(`#password`).evaluate(select => select.value)).toBe(password);
        expect(await page.locator(`#host`).evaluate(select => select.value)).toBe(host);
        expect(await page.locator(`#database`).evaluate(select => select.value)).toBe(database);
    });
}


const aliasDefaultsWithExistingConnection = [
  { label: 'DuckDB', connectionName: 'duckdb'},
  { label: 'SQLite', connectionName: 'sqlite'},
  { label: 'PostgreSQL', connectionName: 'postgresql'},
  { label: 'MySQL', connectionName: 'mysql'},
  { label: 'MariaDB', connectionName: 'mariadb'},
  { label: 'Snowflake', connectionName: 'snowflake'},
  { label: 'Oracle', connectionName: 'oracle'},
  { label: 'MSSQL',connectionName: 'mssql'},
  { label: 'Redshift', connectionName: 'redshift'}
 ]

for (const { label, connectionName } of aliasDefaultsWithExistingConnection) {
    test(`test default connection alias appears if there is an existing connection : ${label}`, async ({ page }) => {
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

            await page.locator('#createNewConnection').click();
            await page.locator('#selectConnection').selectOption({ label: label });

            expect(await page.locator(`#connectionName`).evaluate(select => select.value)).toBe(connectionName);
        });
}


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
    await expect(page.locator('.user-error-message')).toContainText('UsageError');

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

    await expect(page.locator('.user-error-message')).toContainText("A connection named 'default' already exists in your connections file");
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


    await expect(page.locator('.user-error-message')).toContainText("A connection named 'default' already exists in your connections file");
});