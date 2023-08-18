// Opens a comm from the frontend to the kernel
import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';
import { IDisposable, DisposableDelegate } from '@lumino/disposable';
import { DocumentRegistry } from '@jupyterlab/docregistry';


export const registerCommTargets = (context: DocumentRegistry.IContext<INotebookModel>): void => {
  const sessionContext = context.sessionContext;
  const kernel = sessionContext.session?.kernel;

  if (!kernel)
    return

  // Listen to updateTableWidget event
  document.addEventListener("onUpdateTableWidget", async (event: Event) => {
    const customEvent = <CustomEvent>event
    const data = customEvent.detail.data

    // Register to table_widget handler in the JupySQL kernel
    const comm = kernel.createComm("comm_target_handle_table_widget");

    await comm.open('initializing connection').done;

    // Send data to the Kernel to recevice rows to display
    comm.send(data);

    // Handle recevied rows
    comm.onMsg = (msg) => {
      const content = msg.content;
      const data = <{ rows: any }>content.data;

      // Raise event to update table with new rows
      let customEvent = new CustomEvent('onTableWidgetRowsReady', {
        bubbles: true,
        cancelable: true,
        composed: false,
        detail: {
          data: data
        }
      });
      document.body.dispatchEvent(customEvent);
    }
  })

};



// comm listener required for JupySQL table widget
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

