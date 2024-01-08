import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { ICompletionProviderManager } from '@jupyterlab/completer';
import { INotebookTracker } from '@jupyterlab/notebook';

import { SQLCompleterProvider } from './customconnector';

/**
 * Initialization data for the extension.
 */
const plugin_completer: JupyterFrontEndPlugin<void> = {
    id: 'completer',
    description: 'Minimal JupyterLab extension setting up the completion.',
    autoStart: true,
    requires: [ICompletionProviderManager, INotebookTracker],
    activate: async (
      app: JupyterFrontEnd,
      completionManager: ICompletionProviderManager,
      notebooks: INotebookTracker
    ) => {
      completionManager.registerProvider(new SQLCompleterProvider());
    }
};

export { plugin_completer }
