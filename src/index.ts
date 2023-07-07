import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin,
} from '@jupyterlab/application';

import {
  ContextConnector,
  ICompletionManager,
  KernelConnector,
} from '@jupyterlab/completer';

import { INotebookTracker, NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { CompletionConnector } from './connector';

import { CustomConnector } from './customconnector';


// for syntax highlighting
import { CodeMirrorEditor, ICodeMirror } from '@jupyterlab/codemirror';
import * as _ from 'underscore';


import { IDisposable, DisposableDelegate } from '@lumino/disposable';


import { ToolbarButton } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';
import { JupyterlabNotebookCodeFormatter } from './formatter';
import { showDeploymentDialog } from './dialog';
import { registerCommTargets } from './comm'

// widgets
import { Application, IPlugin } from '@lumino/application';
import { Widget } from '@lumino/widgets';
import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';
import { widgetExports } from './index-widgets';
import { MODULE_NAME, MODULE_VERSION } from './version';

/**
 * The command IDs used by the console plugin.
 */
namespace CommandIDs {
  export const invoke = 'completer:invoke';

  export const invokeNotebook = 'completer:invoke-notebook';

  export const select = 'completer:select';

  export const selectNotebook = 'completer:select-notebook';
}

/**
 * Initialization data for the extension.
 */
const extension: JupyterFrontEndPlugin<void> = {
  id: 'completer',
  autoStart: true,
  requires: [ICompletionManager, INotebookTracker],
  activate: async (
    app: JupyterFrontEnd,
    completionManager: ICompletionManager,
    notebooks: INotebookTracker
  ) => {
    console.log('JupyterLab extension jupysql-plugin is activated!');
    // Modelled after completer-extension's notebooks plugin
    notebooks.widgetAdded.connect(
      (sender: INotebookTracker, panel: NotebookPanel) => {
        let editor = panel.content.activeCell?.editor ?? null;
        const session = panel.sessionContext.session;
        const sessionContext = panel.sessionContext;
        const options = { session, editor, sessionContext };
        const connector = new CompletionConnector([]);
        const handler = completionManager.register({
          connector,
          editor,
          parent: panel,
        });

        const updateConnector = () => {
          editor = panel.content.activeCell?.editor ?? null;
          options.session = panel.sessionContext.session;
          options.sessionContext = panel.sessionContext;
          options.editor = editor;
          handler.editor = editor;

          const kernel = new KernelConnector(options);
          const context = new ContextConnector(options);
          const custom = new CustomConnector(options);
          handler.connector = new CompletionConnector([
            kernel,
            context,
            custom
          ]);
        };

        // Update the handler whenever the prompt or session changes
        panel.content.activeCellChanged.connect(updateConnector);
        panel.sessionContext.sessionChanged.connect(updateConnector);
      }
    );

    // Add notebook completer command.
    app.commands.addCommand(CommandIDs.invokeNotebook, {
      execute: () => {
        const panel = notebooks.currentWidget;
        if (panel && panel.content.activeCell?.model.type === 'code') {
          return app.commands.execute(CommandIDs.invoke, { id: panel.id });
        }
      },
    });

    // Add notebook completer select command.
    app.commands.addCommand(CommandIDs.selectNotebook, {
      execute: () => {
        const id = notebooks.currentWidget && notebooks.currentWidget.id;

        if (id) {
          return app.commands.execute(CommandIDs.select, { id });
        }
      },
    });

    // Set enter key for notebook completer select command.
    app.commands.addKeyBinding({
      command: CommandIDs.selectNotebook,
      keys: ['Enter'],
      selector: '.jp-Notebook .jp-mod-completer-active',
    });
  },
};


// %%sql highlighting
class SqlCodeMirror {
  constructor(
    protected app: JupyterFrontEnd,
    protected tracker: INotebookTracker,
    protected code_mirror: ICodeMirror
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
              code_mirror_editor.editor.setOption('mode', 'text/x-sql');
            } else {
              code_mirror_editor.editor.setOption('mode', 'text/x-ipython');
            }
          }, 300);
          code_mirror_editor.editor.on('change', debounced_on_change);
          debounced_on_change();
        }
      }
    });
  }
}

function activate_syntax(
  app: JupyterFrontEnd,
  tracker: INotebookTracker,
  code_mirror: ICodeMirror
): void {
  new SqlCodeMirror(app, tracker, code_mirror);
  console.log('SQLCodeMirror loaded.');
}

/**
 * Initialization data for the jupyterlabs_sql_codemirror extension.
 * this is based on:
 * https://github.com/surdouski/jupyterlabs_sql_codemirror
 */
const extension_sql: JupyterFrontEndPlugin<void> = {
  id: '@ploomber/sql-syntax-highlighting',
  autoStart: true,
  requires: [INotebookTracker, ICodeMirror],
  optional: [],
  activate: activate_syntax
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
export default [extension, extension_sql, formatting_plugin, examplePlugin];
