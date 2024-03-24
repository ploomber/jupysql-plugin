// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// Modified from jupyterlab/packages/completer/src/contextconnector.ts

import { CodeEditor } from '@jupyterlab/codeeditor';
import {
  CompletionHandler,
  ICompletionContext,
  ICompletionProvider
} from '@jupyterlab/completer';

import { keywords } from './keywords.json';

const CELL_MAGIC = '%%sql';
const LINE_MAGIC = '%sql';

/**
 * A custom connector for completion handlers.
 */
export class SQLCompleterProvider implements ICompletionProvider {
  constructor() {
    // Build the completion item from the JSON file.
    this._items = keywords.map(item => {
      return {
        label: item.value,
        type: 'keyword'
      }
    })
  }

  /**
   * The context completion provider is applicable on all cases.
   * @param context - additional information about context of completion request
   */
  async isApplicable(context: ICompletionContext): Promise<boolean> {
    const editor = context.editor;
    if (editor === undefined)
      return false;

    // If this is a SQL magic cell, then we can complete
    const firstLine = editor.getLine(0);
    if (firstLine.slice(0, CELL_MAGIC.length) === CELL_MAGIC)
      return true;

    // Otherwise, if we're to the right of a line magic, we can complete
    const currPos = editor.getCursorPosition();
    const lineMagicPos = editor.getLine(currPos.line).indexOf(LINE_MAGIC);
    return (lineMagicPos > -1 && lineMagicPos + LINE_MAGIC.length < currPos.column);
  }

  /**
   * Fetch completion requests.
   *
   * @param request - The completion request text and details.
   * @returns Completion reply
   */
  fetch(
    request: CompletionHandler.IRequest,
    context: ICompletionContext
  ): Promise<CompletionHandler.ICompletionItemsReply> {
    const editor = context.editor;
    if (!editor) {
      return Promise.reject('No editor');
    }
    return new Promise<CompletionHandler.ICompletionItemsReply>(resolve => {
      resolve(Private.completionHint(editor!, this._items));
    });
  }

  readonly identifier = 'CompletionProvider:custom';
  readonly renderer: any = null;
  private _items: CompletionHandler.ICompletionItem[];
}

/**
 * A namespace for Private functionality.
 */
namespace Private {
  /**
   * Get a list of completion hints.
   *
   * @param editor Editor
   * @returns Completion reply
   */
  export function completionHint(
    editor: CodeEditor.IEditor,
    baseItems: CompletionHandler.ICompletionItem[]
  ): CompletionHandler.ICompletionItemsReply {
    // Find the token at the cursor
    const token = editor.getTokenAtCursor();

    // Find all the items containing the token value.
    let items = baseItems.filter(
      item => item.label.toLowerCase().includes(token.value.toLowerCase())
    );

    // Sort the items.
    items = items.sort((a, b) => {
      return sortItems(
        token.value.toLowerCase(),
        a.label.toLowerCase(),
        b.label.toLowerCase()
      );
    });

    return {
      start: token.offset,
      end: token.offset + token.value.length,
      items: items
    };
  }

  /**
   * Compare function to sort items.
   * The comparison is based on the position of the token in the label. If the positions
   * are the same, it is sorted alphabetically, starting at the token.
   *
   * @param token - the value of the token in lower case.
   * @param a - the label of the first item in lower case.
   * @param b - the label of the second item in lower case.
   */
  function sortItems(
    token: string,
    a: string,
    b: string
  ): number {
    const ind1 = a.indexOf(token);
    const ind2 = b.indexOf(token);
    if (ind1 < ind2) {
      return -1;
    } else if (ind1 > ind2) {
      return 1;
    } else {
      const end1 = a.slice(ind1);
      const end2 = b.slice(ind1);
      return end1 <= end2 ? -1 : 1;
    }
  }
}
