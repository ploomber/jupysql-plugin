import { test } from '@jupyterlab/galata';
import { expect } from '@playwright/test';
import { createNewNotebook, displayWidget } from './utils';


const aliasDefaultsWithExistingConnection = [
    { label: 'DuckDB', connectionName: 'duckdb' },
    { label: 'SQLite', connectionName: 'sqlite' },
    { label: 'PostgreSQL', connectionName: 'postgresql' },
    { label: 'MySQL', connectionName: 'mysql' },
    { label: 'MariaDB', connectionName: 'mariadb' },
    { label: 'Snowflake', connectionName: 'snowflake' },
    { label: 'Oracle', connectionName: 'oracle' },
    { label: 'MSSQL', connectionName: 'mssql' },
    { label: 'Redshift', connectionName: 'redshift' }
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


const autoPopulatedFields = [
    { label: "MySQL", port: "3306" },
    { label: "MariaDB", port: "3306" },
    { label: "Snowflake", port: "443" },
    { label: "Oracle", port: "1521" },
    { label: "MSSQL", port: "1433" },
    { label: "Redshift", port: "5439" }
];

for (const { label, port } of autoPopulatedFields) {
    test(`test fields are auto-populated if dropdown selection changes: ${label}`, async ({
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
        await page.locator("#port").fill("5432");
        await page.locator("#database").fill("somedb");
        await page.locator("#selectConnection").selectOption({ label: label });

        expect(await page.locator(`#port`).evaluate((select) => select.value)).toBe(
            port
        );
        expect(
            await page.locator(`#connectionName`).evaluate((select) => select.value)
        ).toBe("default");
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

const autoPopulatedFieldsExistingConnection = [
    { label: "MySQL", connectionName: "mysql", port: "3306" },
    { label: "MariaDB", connectionName: "mariadb", port: "3306" },
    { label: "Snowflake", connectionName: "snowflake", port: "443" },
    { label: "Oracle", connectionName: "oracle", port: "1521" },
    { label: "MSSQL", connectionName: "mssql", port: "1433" },
    { label: "Redshift", connectionName: "redshift", port: "5439" },
];

for (const { label, connectionName, port } of autoPopulatedFieldsExistingConnection) {
    test(`test fields are auto-populated if dropdown selection changes, existing connection
         present, default DB alias displayed: ${label}`, async ({
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
        await page.locator("#username").fill("someuser");
        await page.locator("#password").fill("somepassword");
        await page.locator("#host").fill("localhost");
        await page.locator("#port").fill("5432");
        await page.locator("#database").fill("somedb");
        await page.locator("#selectConnection").selectOption({ label: label });

        expect(
            await page.locator(`#connectionName`).evaluate((select) => select.value)
        ).toBe(connectionName);
        expect(await page.locator(`#port`).evaluate((select) => select.value)).toBe(
            port);
        expect(
            await page.locator(`#username`).evaluate((select) => select.value)
        ).toBe("someuser");
        expect(
            await page.locator(`#password`).evaluate((select) => select.value)
        ).toBe("somepassword");
        expect(await page.locator(`#host`).evaluate((select) => select.value)).toBe("localhost");
        expect(
            await page.locator(`#database`).evaluate((select) => select.value)
        ).toBe("somedb");
    });
}