
import { INotebookTracker, NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { IDisposable, DisposableDelegate } from '@lumino/disposable';
import { ToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';

import { JupyterlabNotebookCodeFormatter } from './formatter';
import { DeployingExtension } from '../deploy-notebook/index';
import { RegisterNotebookCommListener } from '../comm';

/**
 * A notebook widget extension that adds a format button to the toolbar.
 */
export class FormattingExtension
    implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
    /**
     * Create a new extension for the notebook panel widget.
     *
     * @param panel Notebook panel
     * @param context Notebook context
     * @returns Disposable on the added button
     */

    private notebookCodeFormatter: JupyterlabNotebookCodeFormatter;


    constructor(
        tracker: INotebookTracker
    ) {
        this.notebookCodeFormatter = new JupyterlabNotebookCodeFormatter(
            tracker
        );
    }


    createNew(
        panel: NotebookPanel,
        context: DocumentRegistry.IContext<INotebookModel>
    ): IDisposable {
        const clearOutput = () => {
            this.notebookCodeFormatter.formatAllCodeCells(undefined, undefined, panel.content)
        };
        const button = new ToolbarButton({
            className: 'format-sql-button',
            label: 'Format SQL',
            onClick: clearOutput,
            tooltip: 'Format all %%sql cells',
        });
        button.node.setAttribute("data-testid", "format-btn");

        panel.toolbar.insertItem(10, 'formatSQL', button);
        return new DisposableDelegate(() => {
            button.dispose();
        });
    }
}

/**
 * Activate the extension.
 *
 * @param app Main application object
 */
const plugin_formatting: JupyterFrontEndPlugin<void> = {
    activate: (
        app: JupyterFrontEnd,
        tracker: INotebookTracker,
    ) => {

        app.docRegistry.addWidgetExtension('Notebook', new FormattingExtension(
            tracker,
        ));
        app.docRegistry.addWidgetExtension('Notebook', new DeployingExtension());
        app.docRegistry.addWidgetExtension('Notebook', new RegisterNotebookCommListener());

    },
    autoStart: true,
    id: "formatting",
    requires: [
        INotebookTracker,
    ]
};


export { plugin_formatting }