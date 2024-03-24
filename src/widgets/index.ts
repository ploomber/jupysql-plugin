import { Application, IPlugin } from '@lumino/application';
import { Widget } from '@lumino/widgets';
import { IJupyterWidgetRegistry } from '@jupyter-widgets/base';

import * as connectorWidget from './connector';
import { MODULE_NAME, MODULE_VERSION } from '../version';



const EXTENSION_ID = 'jupysql-plugin:plugin';

/**
 * The widgets plugin.
 */
const plugin_widget: IPlugin<Application<Widget>, void> = {
    id: EXTENSION_ID,
    requires: [IJupyterWidgetRegistry],
    activate: activateWidgetExtension,
    autoStart: true,
};

/**
 * Activate the widget extension.
 */
function activateWidgetExtension(
    app: Application<Widget>,
    registry: IJupyterWidgetRegistry
): void {
    registry.registerWidget({
        name: MODULE_NAME,
        version: MODULE_VERSION,
        exports: connectorWidget,
    });
}

export { plugin_widget }
