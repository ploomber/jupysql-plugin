import { Extension, Facet, RangeSetBuilder } from '@codemirror/state';
import {
    Decoration,
    DecorationSet,
    EditorView,
    ViewPlugin,
    ViewUpdate
} from '@codemirror/view';
import { sql } from '@codemirror/lang-sql';

// Defines new styles for this extension
const baseTheme = EditorView.baseTheme({
    // We need to set some transparency because the stripe are above
    // the selection layer
    '&light .cm-zebraStripe': { backgroundColor: '#d4fafaaa' },
    '&dark .cm-zebraStripe': { backgroundColor: '#1a2727aa' }
});

// Resolve step to use in the editor
const stepSize = Facet.define<number, number>({
    combine: values => (values.length ? Math.min(...values) : 2)
});

// Add decoration to editor lines
const stripe = Decoration.line({
    attributes: { class: 'cm-zebraStripe' }
});

// Create the range of lines requiring decorations
function stripeDeco(view: EditorView) {
    const step = view.state.facet(stepSize);
    const builder = new RangeSetBuilder<Decoration>();
    for (const { from, to } of view.visibleRanges) {
        for (let pos = from; pos <= to;) {
            const line = view.state.doc.lineAt(pos);
            if (line.number % step === 0) {
                builder.add(line.from, line.from, stripe);
            }
            pos = line.to + 1;
        }
    }
    return builder.finish();
}

// Update the decoration status of the editor view
const showStripes = ViewPlugin.fromClass(
    class {
        decorations: DecorationSet;

        constructor(view: EditorView) {
            this.decorations = stripeDeco(view);
        }

        update(update: ViewUpdate) {
            // Update the stripes if the document changed,
            // the viewport changed or the stripes step changed.
            const oldStep = update.startState.facet(stepSize);
            if (
                update.docChanged ||
                update.viewportChanged ||
                oldStep !== update.view.state.facet(stepSize)
            ) {
                this.decorations = stripeDeco(update.view);
            }


            // let docIsSQL = /^\s*SELECT/.test(update.state.doc.sliceString(0, 100))
            // // let stateIsSQL = tr.startState.facet(language) == htmlLanguage
            // // if (docIsSQL == stateIsSQL) return null
            // update.view.dispatch({
            //     effects: languageConf.reconfigure(docIsSQL ? sql() : sql())
            // })
        }
    },
    {
        decorations: v => v.decorations
    }
);


import { EditorState, Compartment } from "@codemirror/state"
// import { language } from "@codemirror/language"
import { python } from "@codemirror/lang-python"

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
export function zebraStripes(options: { step?: number } = {}): Extension {
    return [
        baseTheme,
        typeof options.step !== 'number' ? [] : stepSize.of(options.step),
        showStripes,
        languageConf.of(python()),
        autoLanguage,
    ];
}
