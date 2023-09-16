import {
    JupyterFrontEnd,
    JupyterFrontEndPlugin,
} from '@jupyterlab/application';
import { NotebookPanel } from '@jupyterlab/notebook';
import { ISettingRegistry } from '@jupyterlab/settingregistry';
import { Signal } from '@lumino/signaling'; // Import the Signal class


const PLUGIN_ID = 'jupysql-plugin:settings-example';
const COMMAND_ID = 'jupysql-plugin:toggle-flag';

export const settingsChanged = new Signal<any, any>({});


/**
 * Initialization data for the settings extension.
 */
const plugin_settings: JupyterFrontEndPlugin<void> = {
    id: PLUGIN_ID,
    autoStart: true,
    requires: [ISettingRegistry],
    activate: (app: JupyterFrontEnd, settings: ISettingRegistry, panel: NotebookPanel) => {
        const { commands } = app;
        let limit = 25;
        let flag = false;

        /**
         * Load the settings for this extension
         *
         * @param setting Extension settings
         */
        function loadSetting(setting: ISettingRegistry.ISettings): void {
            // Read the settings and convert to the correct type
            limit = setting.get('limit').composite as number;
            flag = setting.get('flag').composite as boolean;

            console.log(
                `Settings Example extension: Limit is set to '${limit}' and flag to '${flag}'`
            );


            settingsChanged.emit({ limit, flag });

        }

        // Wait for the application to be restored and
        // for the settings for this plugin to be loaded
        Promise.all([app.restored, settings.load(PLUGIN_ID)])
            .then(([, setting]) => {
                // Read the settings
                loadSetting(setting);

                // Listen for your plugin setting changes using Signal
                setting.changed.connect(loadSetting);

                commands.addCommand(COMMAND_ID, {
                    label: 'Toggle Flag and Increment Limit',
                    isToggled: () => flag,
                    execute: () => {
                        // Programmatically change a setting
                        Promise.all([
                            setting.set('flag', !flag),
                            setting.set('limit', limit + 1),
                        ])
                            .then(() => {
                                const newLimit = setting.get('limit').composite as number;
                                const newFlag = setting.get('flag').composite as boolean;
                                window.alert(
                                    `Settings Example extension: Limit is set to '${newLimit}' and flag to '${newFlag}'`
                                );
                            })
                            .catch((reason) => {
                                console.error(
                                    `Something went wrong when changing the settings.\n${reason}`
                                );
                            });
                    },
                });
            })
            .catch((reason) => {
                console.error(
                    `Something went wrong when reading the settings.\n${reason}`
                );
            });
    },
};

export { plugin_settings }