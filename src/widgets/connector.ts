import {
    DOMWidgetModel,
    DOMWidgetView,
    ISerializers,
} from '@jupyter-widgets/base';

import { MODULE_NAME, MODULE_VERSION } from '../version';


// Import the CSS
import '../../style/connector.css';


interface Connection {
    name: string,
    driver: string,
    username: string,
    password: string,
    host: string,
    port: string,
    database: string,
}

interface ConnectionTemplate {
    fields: Array<Field>,
    connection_string: string
}

interface Field {
    id: string,
    label: string,
    type: string,
    default: string
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
            connections: ConnectorModel.connections,
            connections_templates: ConnectorModel.connections_templates,
            driver_to_dbname: ConnectorModel.driver_to_dbname,
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
    static connections: any[] = [];
    static connections_templates: any[] = [];
    static driver_to_dbname: any[] = [];
}

export class ConnectorView extends DOMWidgetView {

    // available connections
    connections = JSON.parse(this.model.get('connections'));

    // connections templates for creating a new connection
    connectionsTemplates = JSON.parse(this.model.get('connections_templates'));


    driver_to_dbname = this.model.get('driver_to_dbname');

    activeConnection = ""


    render() {
        this.el.classList.add('connector-widget');

        this.drawConnectionsList(this.connections);

        // Listen for messages from the Python backend
        this.model.on('msg:custom', this.handleMessage.bind(this));
    }

    /**
     * Draws the connection list
     *
     *
     * @param connection : The availble connections
     */
    drawConnectionsList(connections: Array<Connection>) {
        console.log('driver to db name', this.driver_to_dbname)

        this.el.innerHTML = ""
        const template = `
        <div id="connectionsManager">
            <div id="connectionsContainer" class="block">
                <h3>
                    Connections
                </h3>

                <div class="connections-guidelines block">
                    <i>
                        * Connections are loaded from your connections file (set it with <code>%config SqlMagic.dsn_filename = "path/to/file", default is "~/.jupysql/connections.ini"</code>).
                    </i>

                    <i class="no-config-file" style = "display: none;">
                        * No connections file found. You may need to restart the kernel.
                    </i>

                    <i class="restart-kernel" style = "display: none;">
                        * No connections found in connections file. You may need to restart the kernel.
                    </i>
                </div>

                <div id="connectionsButtonsContainer" class="block">
                </div>

                <div class="block">
                    <div class="create-new-connection" id="createNewConnectionButton">
                        <div class="icon"></div>
                        <div id="createNewConnection">
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
                <h3 id="connectionFormHeader"></h3>
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
            connectButton.className = "secondary connectionStatusButton";
            connectButton.innerHTML = "Connect";
            connectButton.onclick = this.handleConnectionClick.bind(this, connection);

            // button to edit a connection
            const editConnection = document.createElement("BUTTON");
            editConnection.className = `edit-connection-button`;
            editConnection.id = `editConnBtn_${name_without_spaces}`;
            editConnection.onclick = this.handleEditConnectionClick.bind(this, connection);

            // trash can button to delete a connection
            const deleteConnection = document.createElement("BUTTON");
            deleteConnection.className = `delete-connection-button`;
            deleteConnection.id = `deleteConnBtn_${name_without_spaces}`;
            deleteConnection.onclick = this.handleDeleteConnectionClick.bind(this, connection);

            // add buttons to the actions container
            let connectionsButtonsContainer = this.el.querySelector('#connectionsButtonsContainer');
            actionsContainer.appendChild(connectButton);
            actionsContainer.appendChild(editConnection);
            actionsContainer.appendChild(deleteConnection);

            buttonContainer.appendChild(actionsContainer);
            connectionsButtonsContainer.appendChild(buttonContainer);

            let divider = document.createElement("HR");
            divider.className = "divider";
            buttonContainer.appendChild(divider);

        });

        // Draw new connection dropdown
        const select = this.el.querySelector("#selectConnection");
        Object.keys(this.connectionsTemplates).forEach(key => {
            const option = document.createElement("OPTION");
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
    handleConnectionClick(connection: Connection) {
        const message = {
            method: 'connect',
            data: connection
        };

        this.send(message);
    }

    deleteConnection(connection: Connection) {
        const message = {
            method: 'delete_connection',
            data: connection
        };

        this.send(message);
    }


    handleEditConnectionClick(connection: Connection) {
        this.el.querySelector("#connectionFormHeader").innerHTML = "Edit connection";

        // hide connectionsContainer
        (<HTMLElement>this.el.querySelector("#connectionsContainer")).style.display = "none";

        // show newConnectionContainer
        (<HTMLElement>this.el.querySelector("#newConnectionContainer")).style.display = "block";


        const dropdown = <HTMLSelectElement>this.el.querySelector("#selectConnection");
        const valueToSelect = this.driver_to_dbname[connection.driver];

        for (let i = 0; i < dropdown.options.length; i++) {
            if (dropdown.options[i].value === valueToSelect) {
                dropdown.selectedIndex = i;
                break;
            }
        }

        const select = (<HTMLSelectElement>this.el.querySelector("#selectConnection"));
        const key = select.value;
        const connectionTemplate = this.connectionsTemplates[key];
        this.drawConnectionDetailsForm(connectionTemplate, connection.name);

        const name = (<HTMLSelectElement>this.el.querySelector("#connectionName"));
        if (name) {
            name.value = connection.name;
        }

        const username = (<HTMLSelectElement>this.el.querySelector("#username"));
        if (username) {
            username.value = connection.username;
        }

        const password = (<HTMLSelectElement>this.el.querySelector("#password"));
        if (password) {
            password.value = connection.password;
        }

        const host = (<HTMLSelectElement>this.el.querySelector("#host"));
        if (host) {
            host.value = connection.host;
        }

        const db = (<HTMLSelectElement>this.el.querySelector("#database"));
        if (db) {
            db.value = connection.database;
        }

        const port = (<HTMLSelectElement>this.el.querySelector("#port"));
        if (port) {
            port.value = connection.port;
        }
    }

    handleDeleteConnectionClick(connection: Connection) {
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

        const deleteButton = document.createElement("BUTTON");
        deleteButton.innerHTML = "Delete";
        deleteButton.className = "danger";
        deleteButton.id = "deleteConnectionButton";
        deleteButton.addEventListener("click", this.deleteConnection.bind(this, connection))
        deleteConnectionMessage.querySelector(".actions").appendChild(deleteButton);

        // hide controllers
        const deleteConnBtn = this.el.querySelector(`#deleteConnBtn_${connection["name"].replace(/ /g, "_")}`);
        const actionsContainer = <HTMLElement>deleteConnBtn.parentNode;
        actionsContainer.style.display = "none"

        // show buttons
        const buttonsContainer = <HTMLElement>actionsContainer.parentNode;
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
        this.el.querySelector("#connectionFormHeader").innerHTML = "Create new connection";

        // hide connectionsContainer
        (<HTMLElement>this.el.querySelector("#connectionsContainer")).style.display = "none";

        // show newConnectionContainer
        (<HTMLElement>this.el.querySelector("#newConnectionContainer")).style.display = "block";

        this.handleCreateNewConnectionChange()
    }

    /**
     * Handle select new connection
     */
    handleCreateNewConnectionChange() {
        const select = (<HTMLSelectElement>this.el.querySelector("#selectConnection"));
        const key = select.value;

        const connectionTemplate = this.connectionsTemplates[key];

        // capture any user inputs before dropdown changed
        const userInputData: { [key: string]: any } = {};

        // get previous selected connection
        const previousSelect = sessionStorage.getItem("selectConnection");

        // when the database selection dropdown changes we need to capture any inputs
        // entered by the user in the previous form and save them in the session.
        // Only the fields which have been changed by the user are saved. This saved
        // data can be used to auto-populate the new form.
        if (previousSelect) {
          const prevConnectionTemplate = this.connectionsTemplates[previousSelect];
          const { fields } = prevConnectionTemplate;
          fields.forEach((field: { id: string; default?: string }) => {
            const id = field.id;
            const defaultValue = field.hasOwnProperty("default")
              ? field["default"]
              : "";
            const formField = <HTMLSelectElement>this.el.querySelector(`#${id}`);
            if (formField && formField.value != defaultValue) {
              userInputData[id] = formField.value;
            }
          });
        }

        // save the previous form details
        sessionStorage.setItem("fieldInputs", JSON.stringify(userInputData));

        // save new DB selection
        sessionStorage.setItem("selectConnection", key);

        this.drawConnectionDetailsForm(connectionTemplate);

        }

    /**
     * Draws a form to create or edit connections
     *
     * @param connectionTemplate - new connection template
     */
    drawConnectionDetailsForm(connectionTemplate: ConnectionTemplate, connectionAlias: string = "") {
        const { fields } = connectionTemplate;

        const savedFields = JSON.parse(sessionStorage.getItem("fieldInputs"));

        const connectionFormContainer = this.el.querySelector("#connectionFormContainer");
        connectionFormContainer.innerHTML = "";

        const connectionForm = document.createElement("FORM");
        connectionForm.id = "connectionForm";
        connectionFormContainer.appendChild(connectionForm)

        // add a hidden value to hold the alias, this is used when editing a connection
        const hiddenInput = document.createElement("input");
        hiddenInput.type = "hidden";
        hiddenInput.name = "existingConnectionAlias";
        hiddenInput.value = connectionAlias || "";
        connectionForm.appendChild(hiddenInput);

        fields.forEach(field => {
            // text description
            const fieldContainer = document.createElement("DIV");
            fieldContainer.className = "field-container";
            const label = <HTMLLabelElement>document.createElement("LABEL");
            label.setAttribute("for", field.id);
            label.innerHTML = field.label;

            // form value
            const input = <HTMLInputElement>document.createElement("INPUT");
            input.id = field.id;
            input.name = field.id;
            input.className = "field";

            // check for saved values
            const savedInput = savedFields ? savedFields[field.id] || "" : "";


            // when creating the connection alias field, set the default value
            // to "default" if there are no connections, this will ensure that
            // the notebook automatically reconnects to the database if the
            // kernel is restarted
            if (field.id == "connectionName" && this.connections.length === 0) {
                if (savedInput) {
                  input.value = savedInput;
                } else {
                  input.value = "default";
                }
            }

            // check if any user inputs saved
            else if (savedInput) {
                input.value = savedInput;
            }

           // otherwise, set the default value if there's one
           else if (field.default !== undefined) {
                input.value = field.default;
            }

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
        cancelButton.addEventListener("click", this.drawConnectionsList.bind(this, this.connections))
        buttonsContainer.appendChild(cancelButton);

        // submit form button
        const submitButton = document.createElement("BUTTON");
        submitButton.className = "primary";
        buttonsContainer.appendChild(submitButton);

        if (connectionAlias) {
            // editing an existing connection
            submitButton.innerHTML = "Update";
            submitButton.id = "updateConnectionFormButton";
            connectionForm.addEventListener("submit", this.handleSubmitNewConnection.bind(this))
        } else {
            // creating a new connection
            submitButton.innerHTML = "Create";
            submitButton.id = "createConnectionFormButton";
            connectionForm.addEventListener("submit", this.handleSubmitNewConnection.bind(this))
        }

        // add buttons to the form
        connectionForm.appendChild(buttonsContainer);


    }

    /**
     * Submits new connection form
     *
     * @param event - Submit event
     */
    handleSubmitNewConnection(event: SubmitEvent) {
        event.preventDefault();
        sessionStorage.clear()

        let allFieldsFilled = true;

        // Extract form data
        const form = event.target as HTMLFormElement;
        const formData = new FormData(form);


        // Convert form data to a plain object
        const formValues: { [key: string]: string } = {};

        for (const [key, value] of formData.entries()) {
            const _value = value.toString();

            formValues[key] = _value;

            // Skip validation for existingConnectionAlias field since it's hidden
            // and only used when editing a connection
            if (key !== "existingConnectionAlias" && _value.length === 0) {
                allFieldsFilled = false;
            }
        }

        const select = <HTMLSelectElement>this.el.querySelector("#selectConnection");

        const driver = this.connectionsTemplates[select.value].driver;

        formValues["driver"] = driver;

        if (allFieldsFilled) {
            this.sendFormData(formValues);
        } else {
            this.showErrorMessage("Error: Please fill in all fields.")
        }
    }




    /**
     * Sends form data to the backend
     *
     * @param formData - FormData object
     */
    sendFormData(formData: { [key: string]: string }) {
        const message = {
            method: "submit_new_connection",
            data: formData
        };


        // NOTE: responses are handled in the `handleMessage` method
        this.send(message);
    }

    /**
     * Handle messages from the backend
     *
     * @param content - The method to invoke with data
     */
    handleMessage(content: any) {
        const errors = ["connection_error", "connection_name_exists_error"]

        if (errors.includes(content.method)) {
            this.showErrorMessage(content.message);
        }

        if (content.method === "update_connections") {
            this.connections = JSON.parse(content.message);

            this.drawConnectionsList(this.connections);
        }

        if (content.method === "connected") {
            const connectionName = content.message;
            this.activeConnection = connectionName;
            this.markConnectedButton(connectionName);
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
    markConnectedButton(connectionName: string) {
        this.el.querySelectorAll('.connection-button-actions .connectionStatusButton')
            .forEach((button: Element) => {
                const buttonEl = (<HTMLButtonElement>button);
                buttonEl.innerHTML = "Connect";
                buttonEl.classList.remove("primary");
                buttonEl.classList.add("secondary");
            });

        const selectedButtonEl = (<HTMLButtonElement>this.el.querySelector(`#connBtn_${connectionName.replace(/ /g, "_")}`));
        selectedButtonEl.innerText = "Connected";
        selectedButtonEl.classList.add("primary");
    }

    showErrorMessage(error: string) {
        const errorEl = <HTMLDivElement>this.el.querySelector(".user-error-message");
        const errorMessageContainer = errorEl.querySelector("pre");
        errorMessageContainer.innerHTML = `${error}`;
        errorEl.style.display = "block";
    }

}
