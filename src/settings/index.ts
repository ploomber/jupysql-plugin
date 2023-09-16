import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Signal } from '@lumino/signaling'; // Import the Signal class


const PLUGIN_ID = 'jupysql-plugin:settings';

export interface JupySQLSettings {
    showDeployNotebook: boolean;
    showFormatSQL: boolean;

}

export const settingsChanged = new Signal<any, JupySQLSettings>({});


/**
 * Initialization data for the settings extension.
 */
const plugin_settings: JupyterFrontEndPlugin<void> = {
    id: PLUGIN_ID,
    autoStart: true,
    requires: [ISettingRegistry],
    activate: (app: JupyterFrontEnd, settings: ISettingRegistry, panel: NotebookPanel) => {
        /**
         * Load the settings for this extension
         *
         * @param setting Extension settings
         */
        function loadSetting(setting: ISettingRegistry.ISettings): void {
            const showDeployNotebook = setting.get('showDeployNotebook').composite as boolean;
            const showFormatSQL = setting.get('showFormatSQL').composite as boolean;

            settingsChanged.emit({ showDeployNotebook, showFormatSQL });

        }

        // Wait for the application to be restored and
        // for the settings for this plugin to be loaded
        Promise.all([app.restored, settings.load(PLUGIN_ID)])
            .then(([, setting]) => {
                // Read the settings
                loadSetting(setting);
                // Listen for your plugin setting changes using Signal
                setting.changed.connect(loadSetting);
            })
            .catch((reason) => {
                console.error(
                    `Something went wrong when reading the settings.\n${reason}`
                );
            });
    },
};

export { plugin_settings }