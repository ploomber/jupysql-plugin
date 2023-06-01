import {
    DOMWidgetModel,
    DOMWidgetView,
    ISerializers,
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from '../version';

// Import the CSS
import '../../style/connector.css';

interface Connection {
    name : string,
    db : string,
    values : []
}

interface ConnectionTemplate {
    fields : Array<Field>,
    connection_string : string
}

interface Field {
    id: string,
    label : string,
    type : string
}

export class ConnectorModel extends DOMWidgetModel {
    defaults() {
        return {
            ...super.defaults(),
            _model_name: ConnectorModel.model_name,
            _model_module: ConnectorModel.model_module,
            _model_module_version: ConnectorModel.model_module_version,
            _view_name: ConnectorModel.view_name,
            _view_module: ConnectorModel.view_module,
            _view_module_version: ConnectorModel.view_module_version,
            connections : "",
            connections_templates : ""
        };
    }

    static serializers: ISerializers = {
        ...DOMWidgetModel.serializers,
        // Add any extra serializers here
    };

    static model_name = 'ConnectorModel';
    static model_module = MODULE_NAME;
    static model_module_version = MODULE_VERSION;
    static view_name = 'ConnectorModel'; // Set to null if no view
    static view_module = MODULE_NAME; // Set to null if no view
    static view_module_version = MODULE_VERSION;
}

export class ConnectorView extends DOMWidgetView {
    
    connections = JSON.parse(this.model.get('connections'));
    connectionsTemplates = JSON.parse(this.model.get('connections_templates'));
    
    render() {
        this.el.classList.add('connector-widget');
        
        this.drawConnectorUI(this.connections);

        // Listen for messages from the Python backend
        this.model.on('msg:custom', this.handleMessage.bind(this));
    }

    /**
     * Draws the connection UI
     * 
     * @param connection : The availble connections
     */
    drawConnectorUI(connections : Array<Connection>) {
        this.el.innerHTML = ""

        const template = `
        <div id="connectionsManager">
            <div id="connectionsContainer">
                <h2>
                    Select connection
                </h2>

                <div id="connectionsButtonsContainer">
                </div>

                <div>
                    <h2>Create new connection</h2>

                    <div class="buttons-container">
                        <button id="createNewConnectionButton">New connection</button>
                    </div>
                </div>
            </div>

            <div id="newConnectionContainer" style = "display: none">
                <h2>Create new connection</h2>
                <select id="selectConnection"></select>

                <form id="connectionForm"></form>
            </div>
        </div>
        `
        this.el.innerHTML = template;

        // Draw connection buttons
        connections.forEach((connection: Connection) => {
            const { name } = connection;
            
            const buttonContainer = document.createElement("DIV");
            buttonContainer.className = "connection-button-container";
            const button = document.createElement("BUTTON");
            button.id = `connBtn_${name}`;
            button.innerHTML = name;
            button.onclick = this.handleConnectionClick.bind(this, connection);
            let connectionsButtonsContainer = this.el.querySelector('#connectionsButtonsContainer');
            buttonContainer.appendChild(button);
            connectionsButtonsContainer.appendChild(buttonContainer);
        });


        // Draw new connection select
        const select = this.el.querySelector("#selectConnection");
        Object.keys(this.connectionsTemplates).forEach(key => {
            const option = document.createElement("OPTION");
            option.setAttribute("value", key);
            option.innerHTML = key;
            select.appendChild(option)
        })

        select.addEventListener("change", this.handleCreateNewConnectionChange.bind(this))

        const newConnectionButton = this.el.querySelector("#createNewConnectionButton");
        newConnectionButton.addEventListener("click", this.handleCreateNewConnectionClick.bind(this));
    }

    handleConnectionClick(connection : any) {
        const message = {
            method: 'connect',
            data: connection
        };

        this.send(message);      
    }

    /**
     * Handle create new connection click
     */
    handleCreateNewConnectionClick() {
        // hide connectionsContainer
        (<HTMLElement>this.el.querySelector("#connectionsContainer")).style.display = "none";

        // show newConnectionContainer
        (<HTMLElement>this.el.querySelector("#newConnectionContainer")).style.display = "block";

        // select first value
        this.handleCreateNewConnectionChange()
    }

    /**
     * Handle select new connection
     */
    handleCreateNewConnectionChange() {
        const select = (<HTMLSelectElement> this.el.querySelector("#selectConnection"));
        const key = select.value;

        const connectionTemplate = this.connectionsTemplates[key];
        this.drawNewConnectionForm(connectionTemplate);
    }

    /**
     * Draws a form to create a new connection
     * 
     * @param connectionTemplate - new connection template
     */
    drawNewConnectionForm(connectionTemplate : ConnectionTemplate) {
        const { fields } = connectionTemplate;

        const connectionForm = this.el.querySelector("#connectionForm");
        connectionForm.innerHTML = "";
        
        fields.forEach(field => {
            const fieldContainer = document.createElement("DIV");
            const label = <HTMLLabelElement>document.createElement("LABEL");
            label.setAttribute("for", field.id);
            label.innerHTML = field.label;
            const input = <HTMLInputElement>document.createElement("INPUT");
            input.id = field.id;
            input.name = field.id;
            input.setAttribute("type", field.type);
            
            fieldContainer.appendChild(label);
            fieldContainer.appendChild(input);

            connectionForm.appendChild(fieldContainer);
        })

        const buttonsContainer = document.createElement("DIV");
        buttonsContainer.className = "buttons-container";

        // cancel button
        const cancelButton = document.createElement("BUTTON");
        cancelButton.innerHTML = "Cancel";
        cancelButton.addEventListener("click", this.drawConnectorUI.bind(this, this.connections))        
        buttonsContainer.appendChild(cancelButton);

        // submit form button
        const submitButton = document.createElement("INPUT");
        submitButton.setAttribute("type", "submit");
        connectionForm.addEventListener("submit", this.handleSubmitNewConnection.bind(this))
        buttonsContainer.appendChild(submitButton);

        connectionForm.appendChild(buttonsContainer);


    }


    handleSubmitNewConnection(event : Event) {
        event.preventDefault();

        // Extract form data
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        // Convert form data to a plain object
        const formValues: { [key: string]: string } = {};
        for (const [key, value] of formData.entries()) {
            formValues[key] = value.toString();
        }
        
        const select = <HTMLSelectElement>this.el.querySelector("#selectConnection");

        formValues["dbName"] = select.value;

        // Call the function to send form data to the Python backend
        this.sendFormData(formValues);
    }

    sendFormData(formData: { [key: string]: string }) {
        // Create a message to send to the Python backend
        const message = {
            method: 'submit_new_connection',
            data: formData
        };

        // todo: validate all inputs are filled

        // Send the message to the Python backend
        this.send(message);
    }

    handleMessage(content: any) {
        if (content.method === 'update_connections') {
            this.connections = JSON.parse(content.message);

            this.drawConnectorUI(this.connections);
        }

        if (content.method === 'connected') {
            const connectionName = content.message
            this.markConnectedButton(connectionName)
        }
    }

    markConnectedButton(connectionName : string) {
        this.el.querySelectorAll(`.connection-button-container button`)
        .forEach((button : Element)  => {
            const buttonStyle = (<HTMLButtonElement> button).style;
            buttonStyle.backgroundColor = "ButtonFace";
            buttonStyle.color = "#000";
        });

        const selectedButtonStyle = (<HTMLButtonElement> this.el.querySelector(`#connBtn_${connectionName}`)).style;
        selectedButtonStyle.backgroundColor = "#f57c00";
        selectedButtonStyle.color = "#fff";
    }

}

