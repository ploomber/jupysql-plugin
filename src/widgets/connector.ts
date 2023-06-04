/**
 * TODOs:
 * 6. Tests
 * 7. Telemetry
 * 8. Compelling design
 * 9. Togge ini keyring - V backend, X front
 * 10. Add more connections
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
    drivername : string
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
            const name_without_spaces = name.replace(/ /g, "_");
            
            const buttonContainer = document.createElement("DIV");
            buttonContainer.className = "connection-button-container";

            const actionsContainer = document.createElement("DIV");
            actionsContainer.className = "connection-button-actions";

            const connectButton = document.createElement("BUTTON");
            connectButton.id = `connBtn_${name_without_spaces}`;
            connectButton.innerHTML = name;
            connectButton.onclick = this.handleConnectionClick.bind(this, connection);

            const deleteConnection = document.createElement("BUTTON");
            deleteConnection.className = `delete-connection-button`;
            deleteConnection.id = `deleteConnBtn_${name_without_spaces}`;
            deleteConnection.onclick = this.handleDeleteConnectionClick.bind(this, connection);

            let connectionsButtonsContainer = this.el.querySelector('#connectionsButtonsContainer');
            actionsContainer.appendChild(connectButton);            
            actionsContainer.appendChild(deleteConnection);

            buttonContainer.appendChild(actionsContainer);
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

    deleteConnection(connection : Connection) {
        const message = {
            method: 'delete_connection',
            data: connection
        };

        this.send(message);      
    }

    handleDeleteConnectionClick(connection : Connection) {
        this.hideDeleteMessageApproval()

        // create new message
        const deleteConnectionMessage = document.createElement("DIV");
        deleteConnectionMessage.id = "deleteConnectionMessage";
        deleteConnectionMessage.innerHTML = 
        "<h4>Are you sure you want to delete this connection?</h4> <div class='actions' style = 'display: inline-flex'></div>";

        const cancelButton = document.createElement("BUTTON");
        cancelButton.innerHTML = "Cancel";
        cancelButton.addEventListener("click", this.hideDeleteMessageApproval.bind(this))
        deleteConnectionMessage.querySelector(".actions").appendChild(cancelButton);

        const approveButton = document.createElement("BUTTON");
        approveButton.innerHTML = "Delete connection";
        approveButton.className = "danger";
        approveButton.addEventListener("click", this.deleteConnection.bind(this, connection))
        deleteConnectionMessage.querySelector(".actions").appendChild(approveButton);

        // hide controllers
        const deleteConnBtn = this.el.querySelector(`#deleteConnBtn_${connection["name"].replace(/ /g, "_")}`);
        const actionsContainer = <HTMLElement> deleteConnBtn.parentNode;
        actionsContainer.style.display = "none"
        
        // show buttons
        const buttonsContainer = <HTMLElement> actionsContainer.parentNode;
        buttonsContainer.appendChild(deleteConnectionMessage);
    }

    hideDeleteMessageApproval() {
        this.el.querySelector("#deleteConnectionMessage")?.remove();
        this.el.querySelectorAll(".connection-button-actions")
        .forEach(c => (<HTMLElement>c).style.display = "inline-flex");
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

        formValues["driver"] = select.value;

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

        if (content.method === "deleted") {
            const connectionName = content.message;

            alert(`${connectionName} deleted successfully`)
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
        this.el.querySelectorAll(`.connection-button-actions button:not(.delete-connection-button)`)
        .forEach((button : Element)  => {
            const buttonStyle = (<HTMLButtonElement> button).style;
            buttonStyle.backgroundColor = "ButtonFace";
            buttonStyle.color = "#000";
        });

        const selectedButtonStyle = (<HTMLButtonElement> this.el.querySelector(`#connBtn_${connectionName.replace(/ /g, "_")}`)).style;
        selectedButtonStyle.backgroundColor = "#f57c00";
        selectedButtonStyle.color = "#fff";
    }

}

