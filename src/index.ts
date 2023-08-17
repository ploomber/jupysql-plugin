import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import { ICompletionProviderManager } from '@jupyterlab/completer';

import { INotebookTracker, NotebookPanel, INotebookModel } from '@jupyterlab/notebook';


import { CustomCompleterProvider } from './completer/customconnector';


import { IDisposable, DisposableDelegate } from '@lumino/disposable';


import { ToolbarButton } from '@jupyterlab/apputils';
import { JupyterlabNotebookCodeFormatter } from './formatter/formatter';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { showDeploymentDialog } from './dialog';
import { registerCommTargets } from './comm'

// widgets
import { Application, IPlugin } from '@lumino/application';
import { Widget } from '@lumino/widgets';
import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import { widgetExports } from './index-widgets';
import { MODULE_NAME, MODULE_VERSION } from './version';

import editor_plugin from "./editor/editor"

/**
 * Initialization data for the extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'completer',
  description: 'Minimal JupyterLab extension setting up the completion.',
  autoStart: true,
  requires: [ICompletionProviderManager, INotebookTracker],
  activate: async (
    app: JupyterFrontEnd,
    completionManager: ICompletionProviderManager,
    notebooks: INotebookTracker
  ) => {
    completionManager.registerProvider(new CustomCompleterProvider());

    console.log('JupyterLab custom completer extension is activated!');
  }
};



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

export class RegisterNotebookCommListener
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel>
{
  /**
   * Register notebook comm
   *
   * @param panel Notebook panel
   * @param context Notebook context
   * @returns Disposable on the added button
   */
  createNew(
    panel: NotebookPanel,
    context: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {

    setTimeout(() => {
      registerCommTargets(context)
    }, 5000)

    return new DisposableDelegate(() => {

    });
  }
}


/**
 * Activate the extension.
 *
 * @param app Main application object
 */
const formatting_plugin: JupyterFrontEndPlugin<void> = {
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


const EXTENSION_ID = 'jupysql-plugin:plugin';

/**
 * The example plugin.
 */
const examplePlugin: IPlugin<Application<Widget>, void> = {
  id: EXTENSION_ID,
  requires: [IJupyterWidgetRegistry],
  activate: activateWidgetExtension,
  autoStart: true,
} as unknown as IPlugin<Application<Widget>, void>;
// the "as unknown as ..." typecast above is solely to support JupyterLab 1
// and 2 in the same codebase and should be removed when we migrate to Lumino.

/**
 * Activate the widget extension.
 */
function activateWidgetExtension(
  app: Application<Widget>,
  registry: IJupyterWidgetRegistry
): void {
  registry.registerWidget({
    name: MODULE_NAME,
    version: MODULE_VERSION,
    exports: widgetExports,
  });
}

export * from './version';
export default [extension, formatting_plugin, examplePlugin, editor_plugin];
