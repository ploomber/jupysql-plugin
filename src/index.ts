import { plugin_syntax_highlight } from './syntax-highlight/index';
import { plugin_completer } from './completer/index';
import { plugin_formatting } from './formatter/index';
import { plugin_widget } from './widgets/index';
import { plugin_settings } from './settings/index';


export * from './version';
export default [plugin_completer, plugin_syntax_highlight, plugin_formatting, plugin_widget, plugin_settings];
