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


export { createNewNotebook, displayWidget, createDefaultConnection }