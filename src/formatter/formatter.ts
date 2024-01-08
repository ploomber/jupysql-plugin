// inspired by: https://github.com/ryantam626/jupyterlab_code_formatter
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
                const text = cell.model.sharedModel.source;

                if (text.startsWith("%%sql")) {
                    const lines = text.split("\n");
                    const sqlCommand = lines.shift();

                    try {
                        const query = format(lines.join("\n"), { language: 'sql', keywordCase: 'upper' })
                        cell.model.sharedModel.source = sqlCommand + "\n" + query;
                    } catch (error) {
                    }


                }
            }
        } catch (error: any) {
            await showErrorMessage('Jupysql plugin formatting', error);
        }
        this.working = false;
    }

    applicable(formatter: string, currentWidget: Widget) {
        const currentNotebookWidget = this.notebookTracker.currentWidget;
        // TODO: Handle showing just the correct formatter for the language later
        return currentNotebookWidget && currentWidget === currentNotebookWidget;
    }
}