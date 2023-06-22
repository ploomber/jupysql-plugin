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
            connections : ConnectorModel.connections,
            connections_templates : ConnectorModel.connections_templates
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
    static connections : any[] = [];
    static connections_templates : any[] = [];
}

export class ConnectorView extends DOMWidgetView {
    
    // availble connections
    connections = JSON.parse(this.model.get('connections'));

    // connections templates for creating a new connection
    connectionsTemplates = JSON.parse(this.model.get('connections_templates'));

    activeConnection = ""
    
    
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
            <div id="connectionsContainer" class="block">
                <h3>
                    Connections
                </h3>

                <div class="connections-guidelines block">
                    <i>
                        * Connections are loaded from connections.ini file
                    </i>

                    <i class="no-config-file" style = "display: none;">
                        * No connections.ini file found. You may need to restart the kernel.
                    </i>

                    <i class="restart-kernel" style = "display: none;">
                        * No connections found in connections.ini file. You may need to restart the kernel.
                    </i>                    
                </div>

                <div id="connectionsButtonsContainer" class="block">
                </div>

                <div class="block">
                    <div class="create-new-connection" id="createNewConnectionButton">
                        <div class="icon"></div>
                        <div>
                            Create new connection
                        </div>
                    </div>
                </div>
         
            </div>

            <div class="user-error-message lm-Widget p-Widget lm-Panel p-Panel jp-OutputArea-child" style = "display: none">
            <div class="lm-Widget jp-RenderedText" data-mime-type="application/vnd.jupyter.stderr">
            <pre></pre>
            </div>
            </div>


            <div id="newConnectionContainer" class="block" style = "display: none">
                <h3>Create new connection</h3>
                <div class="block">
                    <select id="selectConnection"></select>

                    <div id="connectionFormContainer">
                    </div>
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

            const connectionName = document.createElement("DIV");
            connectionName.className = "connection-name";
            connectionName.innerText = name;
            actionsContainer.appendChild(connectionName);            

            const connectButton = document.createElement("BUTTON");
            connectButton.id = `connBtn_${name_without_spaces}`;
            connectButton.className = "secondary";
            connectButton.innerHTML = "Connect";
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

            let divider = document.createElement("HR");
            divider.className = "divider";
            buttonContainer.appendChild(divider);
            
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

        if (this.activeConnection) {
            this.markConnectedButton(this.activeConnection);
        }
        
        setTimeout(() => {
            const message = {
                method: 'check_config_file'
            };


            this.send(message);
        }, 500)
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

        // const warningMessage = `<h4>Delete connection from ini file</h4>
        // <div>Are you sure you want to delete <strong>${connection["name"]}</strong>?<div> 
        // <div>Please note that by doing so, you will permanently remove <strong>${connection["name"]}</strong> from the ini file.<div>`

        const warningMessage = `<h4>Delete ${connection["name"]} from ini file</h4>
        <div>Please note that by doing so, you will permanently remove <strong>${connection["name"]}</strong> from the ini file.<div>
        <div>Are you sure?</div>
        `

        deleteConnectionMessage.innerHTML = `${warningMessage} <div class='actions' style = 'margin-top: 20px; display: inline-flex'></div>`;

        const cancelButton = document.createElement("BUTTON");
        cancelButton.innerHTML = "Cancel";
        cancelButton.addEventListener("click", this.hideDeleteMessageApproval.bind(this))
        deleteConnectionMessage.querySelector(".actions").appendChild(cancelButton);

        const approveButton = document.createElement("BUTTON");
        approveButton.innerHTML = "Delete";
        approveButton.className = "danger";
        approveButton.addEventListener("click", this.deleteConnection.bind(this, connection))
        deleteConnectionMessage.querySelector(".actions").appendChild(approveButton);

        // hide controllers
        const deleteConnBtn = this.el.querySelector(`#deleteConnBtn_${connection["name"].replace(/ /g, "_")}`);
        const actionsContainer = <HTMLElement> deleteConnBtn.parentNode;
        actionsContainer.style.display = "none"
        
        // show buttons
        const buttonsContainer = <HTMLElement> actionsContainer.parentNode;
        buttonsContainer.prepend(deleteConnectionMessage);
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
            fieldContainer.className = "field-container";
            const label = <HTMLLabelElement>document.createElement("LABEL");
            label.setAttribute("for", field.id);
            label.innerHTML = field.label;
            const input = <HTMLInputElement>document.createElement("INPUT");
            input.id = field.id;
            input.name = field.id;
            input.className = "field";
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
        cancelButton.className = "secondary";
        cancelButton.addEventListener("click", this.drawConnectorUI.bind(this, this.connections))        
        buttonsContainer.appendChild(cancelButton);

        // submit form button
        const submitButton = document.createElement("BUTTON");
        submitButton.className = "primary";
        submitButton.innerHTML = "Create";
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
        let allFieldsFilled = true;

        // Extract form data
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);

        // Convert form data to a plain object
        const formValues: { [key: string]: string } = {};
        for (const [key, value] of formData.entries()) {
            const _value = value.toString();

            formValues[key] = _value;
            if (_value.length === 0) {
                allFieldsFilled = false
            }
        }
        
        const select = <HTMLSelectElement>this.el.querySelector("#selectConnection");
        
        const driver = this.connectionsTemplates[select.value].driver;
        
        formValues["driver"] = driver;

        // todo: validate all inputs are filled
        if (allFieldsFilled) {
            this.sendFormData(formValues);
        } else {
            this.showErrorMessage("Error : Please fill in all fields.")
        }
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
            this.activeConnection = connectionName;
            this.markConnectedButton(connectionName);
        }



        if (content.method === "connection_name_exists_error") {
            const connectionName = content.message;            
            const error = `${connectionName} is already exists`;
            this.showErrorMessage(error);
        }

        if (content.method === "connection_error") {
            const error = content.message;
            this.showErrorMessage(error);
        }

        if (content.method === "check_config_file") {
            const isExist = content.message;
            const i = <HTMLElement>this.el.querySelector(".connections-guidelines .no-config-file")
            if (isExist) {
                i.style.display = "none";

                const iKernelMessage = <HTMLElement>this.el.querySelector(".connections-guidelines .no-config-file")
                iKernelMessage.style.display = (this.connections.length === 0) ? "block" : "none";

            } else {
                i.style.display = "block";
            }
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
            const buttonEl = (<HTMLButtonElement> button);
            buttonEl.innerHTML = "Connect";
            buttonEl.classList.remove("primary");
            buttonEl.classList.add("secondary");
        });

        const selectedButtonEl = (<HTMLButtonElement> this.el.querySelector(`#connBtn_${connectionName.replace(/ /g, "_")}`));
        selectedButtonEl.innerText = "Connected";
        selectedButtonEl.classList.add("primary");
    }

    showErrorMessage(error : string) {
        const errorEl = <HTMLDivElement>this.el.querySelector(".user-error-message");
        const errorMessageContainer = errorEl.querySelector("pre");
        errorMessageContainer.innerHTML = `${error}`;
        errorEl.style.display = "block";
    }

}

