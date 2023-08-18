// based on https://github.com/bqplot/bqplot/blob/master/ui-tests/tests/bqplot.test.ts
import { IJupyterLabPageFixture, test } from '@jupyterlab/galata';
import { expect } from '@playwright/test';
import * as path from 'path';
const klaw = require('klaw-sync');


/**
Returns .ipynb files that are not in hidden directories
*/
const filterNotebooks = item => {
    return (
        item.path.includes(".ipynb") &&
        !item.path.split(path.sep).some(component => component.startsWith('.'))
    );
};

const testCells = async (page: IJupyterLabPageFixture, notebook: string, theme: 'JupyterLab Light' | 'JupyterLab Dark', check_output: boolean = true) => {
    const contextPrefix = theme == 'JupyterLab Light' ? 'light' : 'dark';
    page.theme.setTheme(theme);

    let results = [];
    console.log(`Testing notebook: ${notebook}`)

    await page.notebook.openByPath(notebook);
    await page.notebook.activate(notebook);

    let numCellImages = 0;

    const getCaptureImageName = (contextPrefix: string, notebook: string, id: number): string => {
        return `${contextPrefix}-${notebook}-cell-${id}.png`;
    };

    await page.notebook.runCellByCell({
        onAfterCellRun: async (cellIndex: number) => {
            let cell

            if (check_output) {
                cell = await page.notebook.getCellOutput(cellIndex);
            } else {
                cell = await page.notebook.getCellInput(cellIndex);
            }

            if (cell) {
                results.push(await cell.screenshot());
                numCellImages++;
            }
        }
    });

    await page.notebook.save();

    for (let c = 0; c < numCellImages; ++c) {
        expect(results[c]).toMatchSnapshot(getCaptureImageName(contextPrefix, notebook, c));
    }

    await page.notebook.close(true);
}



test.describe('jupysql-plugin ui-test', () => {
    test.beforeEach(async ({ page, tmpPath }) => {
        page.on("console", (message) => {
            console.log('CONSOLE MSG ---', message.text());
        });

        await page.contents.uploadDirectory(
            path.resolve(__dirname, '../notebooks'),
            tmpPath
        );
        await page.filebrowser.openDirectory(tmpPath);
    });

    const paths = klaw(path.resolve(__dirname, '../notebooks'), { filter: item => filterNotebooks(item), nodir: true });
    const notebooks = paths.map(item => path.basename(item.path));

    notebooks.forEach(notebook => {
        test(`jupysql-plugin ui-test for notebook: "${notebook}"`, async ({
            page,
        }) => {
            if (notebook.startsWith('input')) {
                await testCells(page, notebook, 'JupyterLab Light', false);
            } else {
                await testCells(page, notebook, 'JupyterLab Light', true);
            }

        });
    });


});