
import {
    DOMWidgetModel,
    DOMWidgetView,
    ISerializers,
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from './version';

// Import the CSS
import '../style/widget.css';

export class ExampleModel extends DOMWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            _model_name: ExampleModel.model_name,
            _model_module: ExampleModel.model_module,
            _model_module_version: ExampleModel.model_module_version,
            _view_name: ExampleModel.view_name,
            _view_module: ExampleModel.view_module,
            _view_module_version: ExampleModel.view_module_version,
            value: 'Hello World',
        };
    }

    static serializers: ISerializers = {
        ...DOMWidgetModel.serializers,
        // Add any extra serializers here
    };

    static model_name = 'ExampleModel';
    static model_module = MODULE_NAME;
    static model_module_version = MODULE_VERSION;
    static view_name = 'ExampleView'; // Set to null if no view
    static view_module = MODULE_NAME; // Set to null if no view
    static view_module_version = MODULE_VERSION;
}

export class ExampleView extends DOMWidgetView {
    render() {
        this.el.classList.add('custom-widget');

        const template = `
        <form id="myForm">
        <label for="dropdown">Select an option:</label>
        <select id="dropdown" name="dropdown">
          <option value="A">Option A</option>
          <option value="B">Option B</option>
        </select>
      
        <label for="port">Enter a port:</label>
        <input type="number" id="port" name="port">

        <div id="confirmationMessage"></div>
      
        <button type="submit">Submit</button>
      </form>
      
`

        this.el.innerHTML = template;

        // Add event listener for form submission
        const form = this.el.querySelector('#myForm');
        form.addEventListener('submit', this.handleFormSubmit.bind(this));

        // Listen for messages from the Python backend
        this.model.on('msg:custom', this.handleMessage.bind(this));

    }
    handleFormSubmit(event: Event) {
        event.preventDefault();

        // Extract form data
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        // Convert form data to a plain object
        const formValues: { [key: string]: string } = {};
        for (const [key, value] of formData.entries()) {
            formValues[key] = value.toString();
        }

        // Call the function to send form data to the Python backend
        this.sendFormData(formValues);
    }
    sendFormData(formData: { [key: string]: string }) {
        // Create a message to send to the Python backend
        const message = {
            method: 'submit_form',
            data: formData
        };

        // Send the message to the Python backend
        this.send(message);
    }

    handleMessage(content: any) {
        if (content.method === 'display_confirmation_message') {
            const confirmationMessage = this.el.querySelector('#confirmationMessage');
            if (confirmationMessage) {
                confirmationMessage.textContent = content.message;
            }
        }
    }

}

