import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { ToolbarButton } from '@jupyterlab/apputils';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { IDisposable, DisposableDelegate } from '@lumino/disposable';

import { showDeploymentDialog } from '../dialog';

/**
 * A notebook widget extension that adds a deployment button to the toolbar.
 */
export class DeployingExtension
    implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
    /**
     * Create a new extension for the notebook panel widget.
     *
     * @param panel Notebook panel
     * @param context Notebook context
     * @returns Disposable on the added button
     */
    constructor(
    ) {
    }

    createNew(
        panel: NotebookPanel,
        context: DocumentRegistry.IContext<INotebookModel>
    ): IDisposable {

        const clickDeploy = () => {
            showDeploymentDialog(panel, context)
        }
        const button = new ToolbarButton({
            className: 'deploy-nb-button',
            label: 'Deploy Notebook',
            onClick: clickDeploy,
            tooltip: 'Deploy Notebook as dashboards',
        });
        button.node.setAttribute("data-testid", "deploy-btn");

        panel.toolbar.insertItem(10, 'deployNB', button);
        return new DisposableDelegate(() => {
            button.dispose();
        });
    }
}
