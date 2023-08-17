import { Compartment, EditorState, Extension } from "@codemirror/state"
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
