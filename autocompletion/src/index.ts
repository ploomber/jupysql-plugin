import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

/**
 * Initialization data for the autocompletion extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'autocompletion:plugin',
  autoStart: true,
  activate: (app: JupyterFrontEnd) => {
    console.log('JupyterLab extension autocompletion is activated!');
  }
};

export default plugin;
