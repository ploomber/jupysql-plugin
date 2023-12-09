import { test } from '@jupyterlab/galata';
import { expect } from '@playwright/test';
import { createNewNotebook, displayWidget, createDefaultConnection } from './utils';


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



const embeddedDatabaseLabels = ["DuckDB", "SQLite"];

for (const label of embeddedDatabaseLabels) {
  test(`test only relevant fields are auto-populated in embedded dbs
          if dropdown selection changes: ${label}`, async ({ page }) => {
    await displayWidget(page);

    await page.locator("#createNewConnection").click();
    await page
      .locator("#selectConnection")
      .selectOption({ label: "PostgreSQL" });

    await page.locator("#connectionName").fill("somealias");
    await page.locator("#username").fill("someuser");
    await page.locator("#password").fill("somepassword");
    await page.locator("#host").fill("localhost");
    await page.locator("#port").fill("3308");
    await page.locator("#database").fill("somedb");
    await page.locator("#selectConnection").selectOption({ label: label });

    expect(
      await page.locator(`#connectionName`).evaluate((select) => select.value)
    ).toBe("somealias");

    expect(
      await page.locator(`#database`).evaluate((select) => select.value)
    ).toBe("somedb");

    const username = page.locator("#username");
    expect(await username.count()).toBe(0);

    const password = page.locator("#password");
    expect(await password.count()).toBe(0);

    const host = page.locator("#host");
    expect(await host.count()).toBe(0);

    const port = page.locator("#port");
    expect(await port.count()).toBe(0);
  });
}



const autoPopulatedFieldsAliasModified = [
  { label: "MySQL", port: "3306" },
  { label: "MariaDB", port: "3306" },
  { label: "Snowflake", port: "443" },
  { label: "Oracle", port: "1521" },
  { label: "MSSQL", port: "1433" },
  { label: "Redshift", port: "5439" },
];

for (const { label, port } of autoPopulatedFieldsAliasModified) {
  test(`test fields are auto-populated if dropdown selection changes and default
      alias modified by user: ${label}`, async ({
    page,
  }) => {
    await displayWidget(page);

    await page.locator("#createNewConnection").click();
    await page
      .locator("#selectConnection")
      .selectOption({ label: "PostgreSQL" });
    await page.locator("#connectionName").fill("somealias");
    await page.locator("#username").fill("someuser");
    await page.locator("#password").fill("somepassword");
    await page.locator("#host").fill("localhost");
    await page.locator("#port").fill("5432");
    await page.locator("#database").fill("somedb");
    await page.locator("#selectConnection").selectOption({ label: label });

    expect(
      await page.locator(`#connectionName`).evaluate((select) => select.value)
    ).toBe("somealias");
    expect(await page.locator(`#port`).evaluate((select) => select.value)).toBe(
      port
    );
    expect(
      await page.locator(`#username`).evaluate((select) => select.value)
    ).toBe("someuser");
    expect(
      await page.locator(`#password`).evaluate((select) => select.value)
    ).toBe("somepassword");
    expect(await page.locator(`#host`).evaluate((select) => select.value)).toBe(
      "localhost"
    );
    expect(
      await page.locator(`#database`).evaluate((select) => select.value)
    ).toBe("somedb");
  });
}

const autoPopulatedFieldsAliasModifiedExistingConnection = [
  { label: "MySQL", port: "3306" },
  { label: "MariaDB", port: "3306" },
  { label: "Snowflake", port: "443" },
  { label: "Oracle", port: "1521" },
  { label: "MSSQL", port: "1433" },
  { label: "Redshift", port: "5439" }
];

for (const { label, port }
  of autoPopulatedFieldsAliasModifiedExistingConnection) {
  test(`test fields are auto-populated if dropdown selection changes, there is an
            existing connection and default alias modified by user: ${label}`, async ({
    page,
  }) => {
    await createNewNotebook(page);

    await page.notebook.enterCellEditingMode(0);
    const cell = await page.notebook.getCell(0);
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
ConnectorWidget()`);
    await page.notebook.run();

    await page.locator("#createNewConnection").click();
    await page
      .locator("#selectConnection")
      .selectOption({ label: "PostgreSQL" });
    await page.locator("#connectionName").fill("somealias");
    await page.locator("#username").fill("someuser");
    await page.locator("#password").fill("somepassword");
    await page.locator("#host").fill("localhost");
    await page.locator("#port").fill("5432");
    await page.locator("#database").fill("somedb");
    await page.locator("#selectConnection").selectOption({ label: label });

    expect(
      await page.locator(`#connectionName`).evaluate((select) => select.value)
    ).toBe("somealias");
    expect(await page.locator(`#port`).evaluate((select) => select.value)).toBe(
      port
    );
    expect(
      await page.locator(`#username`).evaluate((select) => select.value)
    ).toBe("someuser");
    expect(
      await page.locator(`#password`).evaluate((select) => select.value)
    ).toBe("somepassword");
    expect(await page.locator(`#host`).evaluate((select) => select.value)).toBe(
      "localhost"
    );
    expect(
      await page.locator(`#database`).evaluate((select) => select.value)
    ).toBe("somedb");
  });
}

const databaseLabels = ["MySQL", "MariaDB", "Snowflake", "Oracle", "MSSQL", "Redshift"];

for (const label of databaseLabels) {
  test(`test fields are auto-populated if dropdown selection changes and default
      port modified by user: ${label}`, async ({
    page,
  }) => {
    await displayWidget(page);

    await page.locator("#createNewConnection").click();
    await page
      .locator("#selectConnection")
      .selectOption({ label: "PostgreSQL" });
    await page.locator("#username").fill("someuser");
    await page.locator("#password").fill("somepassword");
    await page.locator("#host").fill("localhost");
    await page.locator("#port").fill("3308");
    await page.locator("#database").fill("somedb");
    await page.locator("#selectConnection").selectOption({ label: label });

    expect(
      await page.locator(`#connectionName`).evaluate((select) => select.value)
    ).toBe("default");
    expect(await page.locator(`#port`).evaluate((select) => select.value)).toBe(
      "3308"
    );
    expect(
      await page.locator(`#username`).evaluate((select) => select.value)
    ).toBe("someuser");
    expect(
      await page.locator(`#password`).evaluate((select) => select.value)
    ).toBe("somepassword");
    expect(await page.locator(`#host`).evaluate((select) => select.value)).toBe(
      "localhost"
    );
    expect(
      await page.locator(`#database`).evaluate((select) => select.value)
    ).toBe("somedb");
  });
}


test('test user inputs discarded after create button clicked', async ({ page }) => {
  await displayWidget(page);

  await page.locator('#createNewConnection').click();
  await page.locator('#selectConnection').selectOption({ label: 'DuckDB' });
  await page.locator('#database').fill('duck.db');
  await page.locator('#createConnectionFormButton').click();

  // Create new connection again
  await page.locator('#createNewConnection').click();
  await page.locator('#selectConnection').selectOption({ label: 'PostgreSQL' });

  expect(
    await page.locator(`#database`).evaluate((select) => select.value)
  ).toBe("");
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