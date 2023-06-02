/**
 * TODOs:
 * 1. Change namings to match the ini file
 * 2. Remove values from front
 * 3. Implement remove connection
 * 4. Fix connection with > 1 parts
 * 5. Existing connection name + alert V
 * 6. Tests
 * 7. Telemetry
 * 8. Compelling design
 * 9. Togge ini keyring - V backend, X front
 * 10. Add more connections
 * 11. If no connections - add default connections to connections.ini
 */

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
    values : [] // todo: remove?
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
    
    // availble connections
    connections = JSON.parse(this.model.get('connections'));

    // connections templates for creating a new connection
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
                <h3>
                    Select a connection
                </h3>

                <div id="connectionsButtonsContainer">
                </div>

                <div>
                    <h3>Create new connection</h3>

                    <div class="buttons-container">
                        <button id="createNewConnectionButton">New connection</button>
                    </div>
                </div>
            </div>

            <div id="newConnectionContainer" style = "display: none">
                <h3>Create new connection</h3>
                <select id="selectConnection"></select>

                <div id="connectionFormContainer">
                </div>
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

    /**
     * Connects to a database
     * 
     * @param connection - connection object
     */    
    handleConnectionClick(connection : Connection) {
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

        const connectionFormContainer = this.el.querySelector("#connectionFormContainer");
        connectionFormContainer.innerHTML = "";

        const connectionForm = document.createElement("FORM");
        connectionForm.id = "connectionForm";
        connectionFormContainer.appendChild(connectionForm)
        
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

    /**
     * Submits new connection form 
     * 
     * @param event - Submit event
     */  
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

    /**
     * Sends form data to the backend
     * 
     * @param formData - FormData object
     */      
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

    /**
     * Handle messages from the backend
     * 
     * @param content - The method to invoke with data
     */     
    handleMessage(content: any) {
        if (content.method === "update_connections") {
            this.connections = JSON.parse(content.message);

            this.drawConnectorUI(this.connections);
        }

        if (content.method === "connected") {
            const connectionName = content.message;
            this.markConnectedButton(connectionName);
        }

        if (content.method === "connection_name_exists_error") {
            const connectionName = content.message;
            
            alert(`${connectionName} is already exists`)
        }
    }

    /**
     * Marks active connection button
     * 
     * @param connectionName - Active connection name
     */    
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

