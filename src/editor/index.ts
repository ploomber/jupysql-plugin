import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  EditorExtensionRegistry,
  IEditorExtensionRegistry
} from '@jupyterlab/codemirror';

import { languageSelection } from './editor';

/**
 * Initialization data for the @jupyterlab-examples/codemirror-extension extension.
 */
const plugin_editor: JupyterFrontEndPlugin<void> = {
  id: 'jupysql-plugin:syntax-highlighting',
  description: 'A minimal JupyterLab extension adding a CodeMirror extension.',
  autoStart: true,
  requires: [IEditorExtensionRegistry],
  activate: (app: JupyterFrontEnd, extensions: IEditorExtensionRegistry) => {
    // Register a new editor configurable extension
    extensions.addExtension(
      Object.freeze({
        name: 'jupysql-plugin:syntax-highlighting',
        // Default CodeMirror extension parameters
        default: 2,
        factory: () =>
          // The factory will be called for every new CodeMirror editor
          EditorExtensionRegistry.createConfigurableExtension(() =>
              languageSelection()
          )
      })
    );
  }
};

export { plugin_editor };
