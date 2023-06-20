import * as widget from './widgets/form';
import * as widget_table from './widgets/table';
import * as connector_widget from './widgets/connector';

export const widgetExports = {
    ...widget,
    ...widget_table,
    ...connector_widget
};
