// Table widget. Python backend is implemented in TableWidget
import { MODULE_NAME, MODULE_VERSION } from '../version';

import 'bootstrap/dist/css/bootstrap.min.css';

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from '@jupyter-widgets/base';
import { Tooltip } from 'bootstrap';

export class TableModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: TableModel.model_name,
      _model_module: TableModel.model_module,
      _model_module_version: TableModel.model_module_version,
      _view_name: TableModel.view_name,
      _view_module: TableModel.view_module,
      _view_module_version: TableModel.view_module_version,
      value: 'Hello World',
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    // Add any extra serializers here
  };

  static model_name = 'TableModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'TableView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

interface StockData {
  symbol: string;
  price: number;
  change: number;
}

export class TableView extends DOMWidgetView {
  render() {
    const stockData: StockData[] = [
      { symbol: 'AAPL', price: 142.34, change: 1.25 },
      { symbol: 'GOOGL', price: 2725.45, change: -4.56 },
      { symbol: 'MSFT', price: 259.43, change: 2.78 },
      { symbol: 'AMZN', price: 3310.98, change: -7.92 },
    ];

    this.el.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th data-bs-toggle="tooltip" data-bs-placement="top" title="symbol">Symbol</th>
            <th data-bs-toggle="tooltip" data-bs-placement="top" title="price">Price</th>
            <th data-bs-toggle="tooltip" data-bs-placement="top" title="change">Change</th>
          </tr>
        </thead>
        <tbody>
          ${stockData.map((stock) => `
            <tr>
              <td>${stock.symbol}</td>
              <td>${stock.price}</td>
              <td>${stock.change}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    const tooltipTriggerList = Array.from(this.el.querySelectorAll('[data-bs-toggle="tooltip"]')) as HTMLElement[];
    tooltipTriggerList.forEach((tooltipTriggerEl) => {
      const column = tooltipTriggerEl.getAttribute('title') as keyof StockData;
      const tooltipContent = stockData.map((stock) => stock[column]).join(', ');

      new Tooltip(tooltipTriggerEl, {
        title: tooltipContent,
      });
    });
  }
}
