// SQL syntax highlighting extension
import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { INotebookTracker } from '@jupyterlab/notebook';
import { CodeMirrorEditor } from '@jupyterlab/codemirror';
import * as _ from 'underscore';

class SqlCodeMirror {
    constructor(
        protected app: JupyterFrontEnd,
        protected tracker: INotebookTracker
    ) {
        let currentCell = this.tracker?.activeCell;
        let codeMirrorEditor: CodeMirrorEditor = currentCell?.editor as CodeMirrorEditor;

        const debounced_on_change = _.debounce(() => {
            if (!codeMirrorEditor) {
                return;
            }
            // check for editor with first line starting with %%sql
            const line = codeMirrorEditor
                .getLine(codeMirrorEditor?.firstLine())
                ?.trim();
            if (line?.startsWith('%%sql')) {
                codeMirrorEditor.setOption('mode', 'text/x-sql');
            } else {
                codeMirrorEditor.setOption('mode', 'text/x-ipython');
            }
        }, 300);

        this.tracker?.activeCellChanged?.connect(() => {
            currentCell?.model.sharedModel.changed.disconnect(debounced_on_change);
            currentCell = this.tracker?.activeCell;
            codeMirrorEditor = currentCell?.editor as CodeMirrorEditor;
            if (currentCell && currentCell.model.type === 'code') {
                currentCell.model.sharedModel.changed.connect(debounced_on_change);
            }
        });

        if (currentCell && currentCell.model.type === 'code') {
            debounced_on_change();
        }
    }
}

function activate_syntax(
    app: JupyterFrontEnd,
    tracker: INotebookTracker,
): void {
    new SqlCodeMirror(app, tracker);
    console.log('SQLCodeMirror loaded.');
}

/**
 * Initialization data for the jupyterlabs_sql_codemirror extension.
 * this is based on:
 * https://github.com/surdouski/jupyterlabs_sql_codemirror
 */
const plugin_syntax_highlight: JupyterFrontEndPlugin<void> = {
    id: '@ploomber/sql-syntax-highlighting',
    autoStart: true,
    requires: [INotebookTracker],
    optional: [],
    activate: activate_syntax
};



export { plugin_syntax_highlight }
