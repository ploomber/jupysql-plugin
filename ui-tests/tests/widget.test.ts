import { test } from '@jupyterlab/galata';
import { expect } from '@playwright/test';
import { createNewNotebook, displayWidget } from './utils';

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


