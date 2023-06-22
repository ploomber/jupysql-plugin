// based on https://github.com/bqplot/bqplot/blob/master/ui-tests/tests/bqplot.test.ts
import { IJupyterLabPageFixture, test } from '@jupyterlab/galata';
import { expect } from '@playwright/test';
import * as path from 'path';
const klaw = require('klaw-sync');


const filterUpdateNotebooks = item => {
    const basename = path.basename(item.path);
    return basename.includes('_update');
}

const filterNotebooks = item => {
    return item.path.includes(".ipynb");
}

const testCellOutputs = async (page: IJupyterLabPageFixture, tmpPath: string, theme: 'JupyterLab Light' | 'JupyterLab Dark') => {
    const paths = klaw(path.resolve(__dirname, '../notebooks'), { filter: item => filterNotebooks(item), nodir: true });
    const notebooks = paths.map(item => path.basename(item.path));

    const contextPrefix = theme == 'JupyterLab Light' ? 'light' : 'dark';
    page.theme.setTheme(theme);

    for (const notebook of notebooks) {
        let results = [];
        console.log(`CHECKING NOTEBOOK: ${notebook}`)

        await page.notebook.openByPath(notebook);
        await page.notebook.activate(notebook);

        let numCellImages = 0;

        const getCaptureImageName = (contextPrefix: string, notebook: string, id: number): string => {
            return `${contextPrefix}-${notebook}-cell-${id}.png`;
        };

        await page.notebook.runCellByCell({
            onAfterCellRun: async (cellIndex: number) => {
                const cell = await page.notebook.getCellOutput(cellIndex);
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
}



test.describe('jupysql-plugin Visual Regression', () => {
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

    test('Light theme: Check jupysql-plugin first renders', async ({
        page,
        tmpPath,
    }) => {
        await testCellOutputs(page, tmpPath, 'JupyterLab Light');
    });

});