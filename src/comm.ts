import { DocumentRegistry } from '@jupyterlab/docregistry';
import { INotebookModel } from '@jupyterlab/notebook';


export const registerCommTargets = (context: DocumentRegistry.IContext<INotebookModel>): void => {
  const sessionContext = context.sessionContext;
  const kernel = sessionContext.session?.kernel;

  if (!kernel)
    return

  document.addEventListener("onUpdateTableWidget", async (event : Event) => {
    const customEvent = <CustomEvent> event
    const data = customEvent.detail.data
    const comm = kernel.createComm("comm_target_handle_table_widget");

    await comm.open('initializing connection').done;

    comm.send(data);

    comm.onMsg = (msg) => {
      const content = msg.content;
      const data = <{rows : any}> content.data;

      let customEvent = new CustomEvent('onTableWidgetRowsReady', {
        bubbles: true,
        cancelable: true,
        composed: false,
        detail : {
            data : data
        }
        });
        document.body.dispatchEvent(customEvent);
    }
  })
  
};
