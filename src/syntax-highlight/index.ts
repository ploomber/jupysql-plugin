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
        this.tracker?.activeCellChanged?.connect(() => {
            if (this.tracker?.activeCell !== null) {
                const cell = this.tracker.activeCell;
                if (cell !== null && cell?.model.type === 'code') {
                    const code_mirror_editor = cell?.editor as CodeMirrorEditor;
                    const debounced_on_change = _.debounce(() => {
                        // check for editor with first line starting with %%sql
                        const line = code_mirror_editor
                            .getLine(code_mirror_editor.firstLine())
                            ?.trim();
                        if (line?.startsWith('%%sql')) {
                            code_mirror_editor.setOption('mode', 'text/x-sql');
                        } else {
                            code_mirror_editor.setOption('mode', 'text/x-ipython');
                        }
                    }, 300);
                    cell.model.sharedModel.changed.connect(debounced_on_change);
                    debounced_on_change();
                }
            }
        });
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