import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import {
  EditorExtensionRegistry,
  IEditorExtensionRegistry
} from '@jupyterlab/codemirror';

import { zebraStripes } from './editor';

/**
 * Initialization data for the @jupyterlab-examples/codemirror-extension extension.
 */
const plugin_editor: JupyterFrontEndPlugin<void> = {
  id: '@jupyterlab-examples/codemirror-extension:plugin',
  description: 'A minimal JupyterLab extension adding a CodeMirror extension.',
  autoStart: true,
  requires: [IEditorExtensionRegistry],
  activate: (app: JupyterFrontEnd, extensions: IEditorExtensionRegistry) => {
    // Register a new editor configurable extension
    extensions.addExtension(
      Object.freeze({
        name: '@jupyterlab-examples/codemirror:zebra-stripes',
        // Default CodeMirror extension parameters
        default: 2,
        factory: () =>
          // The factory will be called for every new CodeMirror editor
          EditorExtensionRegistry.createConfigurableExtension(() =>
              zebraStripes()
          ),
        // JSON schema defining the CodeMirror extension parameters
        schema: {
          type: 'number',
          title: 'Show stripes',
          description: 'Display zebra stripes every "step" in CodeMirror editors.'
        }
      })
    );
  }
};

export { plugin_editor };
