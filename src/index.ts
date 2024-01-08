import { plugin_completer } from './completer/index';
import { plugin_editor } from './editor/index';
import { plugin_formatting } from './formatter/index';
import { plugin_widget } from './widgets/index';
import { plugin_settings } from './settings/index';

export * from './version';
export default [
  plugin_completer,
  plugin_editor,
  plugin_formatting,
  plugin_widget,
  plugin_settings
];
