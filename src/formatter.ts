import { Cell, CodeCell } from '@jupyterlab/cells';
import { INotebookTracker, Notebook } from '@jupyterlab/notebook';
import { Widget } from '@lumino/widgets';
import { showErrorMessage } from '@jupyterlab/apputils';
import { format } from 'sql-formatter';

export class JupyterlabNotebookCodeFormatter {
    protected working: boolean;
    protected notebookTracker: INotebookTracker;

    constructor(
        notebookTracker: INotebookTracker
    ) {
        this.notebookTracker = notebookTracker;
    }

    protected formatCode(
        code: string[],
        formatter: string,
        options: any,
        notebook: boolean,
        cache: boolean
    ) {
        return "format"
    }


    public async formatAction(config: any, formatter?: string) {
        return this.formatCells(true, config, formatter);
    }

    public async formatSelectedCodeCells(
        config: any,
        formatter?: string,
        notebook?: Notebook
    ) {
        return this.formatCells(true, config, formatter, notebook);
    }

    public async formatAllCodeCells(
        config: any,
        formatter?: string,
        notebook?: Notebook
    ) {
        return this.formatCells(false, config, formatter, notebook);
    }

    private getCodeCells(selectedOnly = true, notebook?: Notebook): CodeCell[] {
        if (!this.notebookTracker.currentWidget) {
            return [];
        }
        const codeCells: CodeCell[] = [];
        notebook = notebook || this.notebookTracker.currentWidget.content;
        notebook.widgets.forEach((cell: Cell) => {
            if (cell.model.type === 'code') {
                if (!selectedOnly || notebook.isSelectedOrActive(cell)) {
                    codeCells.push(cell as CodeCell);
                }
            }
        });
        return codeCells;
    }


    private async formatCells(
        selectedOnly: boolean,
        config: any,
        formatter?: string,
        notebook?: Notebook
    ) {

        if (this.working) {
            return;
        }
        try {
            this.working = true;
            const selectedCells = this.getCodeCells(selectedOnly, notebook);
            if (selectedCells.length === 0) {
                this.working = false;
                return;
            }

            for (let i = 0; i < selectedCells.length; ++i) {
                const cell = selectedCells[i];
                const text = cell.model.value.text

                if (text.startsWith("%%sql")) {
                    const lines = text.split("\n");
                    const sqlCommand = lines.shift();

                    try {
                        const query = format(lines.join("\n"), { language: 'sql', keywordCase: 'upper' })
                        cell.model.value.text = sqlCommand + "\n" + query;
                    } catch (error) {
                    }


                }
            }
        } catch (error) {
            await showErrorMessage('Jupyterlab Code Formatter Error', error);
        }
        this.working = false;
    }

    applicable(formatter: string, currentWidget: Widget) {
        const currentNotebookWidget = this.notebookTracker.currentWidget;
        // TODO: Handle showing just the correct formatter for the language later
        return currentNotebookWidget && currentWidget === currentNotebookWidget;
    }
}
