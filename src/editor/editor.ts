import { Extension } from '@codemirror/state';

import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
    EditorExtensionRegistry,
    IEditorExtensionRegistry
} from '@jupyterlab/codemirror';


import { EditorState, Compartment } from "@codemirror/state"
import { python } from "@codemirror/lang-python"
import { sql } from '@codemirror/lang-sql'

const languageConf = new Compartment

const autoLanguage = EditorState.transactionExtender.of(tr => {
    // if (!tr.docChanged) return null
    let docIsSQL = /^\s*%{1,2}sql/.test(tr.newDoc.sliceString(0, 100))
    // let stateIsSQL = tr.startState.facet(language) == htmlLanguage
    // if (docIsSQL == stateIsSQL) return null
    return {
        effects: languageConf.reconfigure(docIsSQL ? sql() : python())
    }
})


// Full extension composed of elemental extensions
export function zebraStripes(): Extension {
    return [
        languageConf.of(python()),
        autoLanguage,
    ];
}

/**
 * Initialization data for the @jupyterlab-examples/codemirror-extension extension.
 */
const editor_plugin: JupyterFrontEndPlugin<void> = {
    id: '@jupyterlab-examples/codemirror-extension:plugin',
    description: 'A minimal JupyterLab extension adding a CodeMirror extension.',
    autoStart: true,
    requires: [IEditorExtensionRegistry],
    activate: (app: JupyterFrontEnd, extensions: IEditorExtensionRegistry) => {
        // Register a new editor configurable extension
        extensions.addExtension(
            Object.freeze({
                name: '@jupyterlab-examples/codemirror:zebra-stripes',
                factory: () =>
                    // The factory will be called for every new CodeMirror editor
                    EditorExtensionRegistry.createConfigurableExtension(() =>
                        zebraStripes()
                    ),
                // JSON schema defining the CodeMirror extension parameters
                schema: {
                    description:
                        'Display zebra stripes every "step" in CodeMirror editors.'
                }
            })
        );
    }
};

export default editor_plugin;