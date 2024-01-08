import { Compartment, EditorState, Extension } from "@codemirror/state"
import { python } from "@codemirror/lang-python"
import { sql } from '@codemirror/lang-sql'

const MAGIC = '%%sql';
const languageConf = new Compartment;

/**
 * This function is called for every transaction (change in cell input).
 * If the cell is an SQL cell (starting with '%%sql'), then the language is set to SQL.
 */
const autoLanguage = EditorState.transactionExtender.of(tr => {
    // Check if the cell input content start with '%%sql', and configure the syntax
    // highlighting to SQL if necessary (default to python).
    const isSQL = tr.newDoc.sliceString(0, MAGIC.length) === MAGIC;
    return {
        effects: languageConf.reconfigure(isSQL ? sql() : python())
    };
})


// Full extension composed of elemental extensions
export function languageSelection(): Extension {
    return [
        languageConf.of(python()),
        autoLanguage,
    ];
}
