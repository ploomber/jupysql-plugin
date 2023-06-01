from jupysql_plugin import __version__, _module_name

from ipywidgets import DOMWidget
from traitlets import Unicode
import json
import pickle
import keyring


class FormWidget(DOMWidget):
    """
    A sample widget that displays a form and process it. This widget is an example,
    not intended for end-users
    """

    _model_name = Unicode("FormModel").tag(sync=True)
    _model_module = Unicode(_module_name).tag(sync=True)
    _model_module_version = Unicode(__version__).tag(sync=True)
    _view_name = Unicode("FormView").tag(sync=True)
    _view_module = Unicode(_module_name).tag(sync=True)
    _view_module_version = Unicode(__version__).tag(sync=True)

    value = Unicode("Hello World").tag(sync=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.on_msg(self._handle_message)

    def _handle_message(self, widget, content, buffers):
        if "method" in content:
            method = content["method"]
            if method == "submit_form":
                form_data = content["data"]
                self._process_form_data(form_data)

    def _process_form_data(self, form_data):
        # Process the form data received from the frontend
        protocol = form_data.get("protocol")
        port_raw = form_data.get("port")

        if port_raw == "":
            self.send_confirmation_message("Please select a port")

        port = int(port_raw)

        if port < 0:
            self.send_confirmation_message("Select a valid port value")
        else:
            self.send_confirmation_message(
                f"You selected protocol: {protocol} and port: {port}"
            )

    def send_confirmation_message(self, message):
        self.send({"method": "display_confirmation_message", "message": message})


class TableWidget(DOMWidget):
    """Example widget showing how to display a tooltip"""

    _model_name = Unicode("TableModel").tag(sync=True)
    _model_module = Unicode(_module_name).tag(sync=True)
    _model_module_version = Unicode(__version__).tag(sync=True)
    _view_name = Unicode("TableView").tag(sync=True)
    _view_module = Unicode(_module_name).tag(sync=True)
    _view_module_version = Unicode(__version__).tag(sync=True)

    def __init__(self, data=None, **kwargs):
        if data is not None:
            self.data = data
        super().__init__(**kwargs)


CONNECTIONS_TEMPLATES = dict(
    {
        "sqlite": {"fields": [
            {
                "id": "connectionName",
                "label": "connection name",
                "type": "text",
            },
        ], "connection_string": "sqlite://"},
        "duckdb": {"fields": [
            {
                "id": "connectionName",
                "label": "connection name",
                "type": "text",
            },
        ], "connection_string": "duckdb://"},
        "postgresql": {
            "fields": [
                {
                    "id": "connectionName",
                    "label": "connection name",
                    "type": "text",
                },
                {
                    "id": "userName",
                    "label": "user name",
                    "type": "text",
                },
                {
                    "id": "password",
                    "label": "password",
                    "type": "password",
                },
                {"id": "server", "label": "server", "type": "text"},
                {"id": "database", "label": "database", "type": "text"},
            ],
            "connection_string": "postgresql://{0}:{1}@{2}/{3}",
        },
    }
)


def _get_stored_connections():
    connections = []
    try:
        with open("connections.pkl", "rb") as f:
            connections = pickle.load(f)
    except FileNotFoundError:
        connections = _get_predefined_connections()
        pass
    return connections


def _get_predefined_connections():
    return [
        {"name": "DuckDB", "db": "duckdb", "values": []},
        {"name": "SQLite", "db": "sqlite", "values": []},
    ]


def _get_connection_string(db, values):
    if len(values) == 0:
        connection_string = CONNECTIONS_TEMPLATES[db]["connection_string"]
    else:
        connection_string = CONNECTIONS_TEMPLATES[db]["connection_string"].format(
            *values
        )

    return connection_string


def _create_new_connection(new_connection_data):
    # no_empty_fields = _check_no_empty_fields(new_connection_data)
    connection_name = new_connection_data.get("connectionName")
    db_name = new_connection_data.get("dbName")

    is_unique_name = _is_unique_connection_name(connection_name)

    if is_unique_name:
        database = new_connection_data.get("database")
        password = new_connection_data.get("password")
        server = new_connection_data.get("server")
        user_name = new_connection_data.get("userName")

        fields = {
            "user_name": user_name,
            "password": password,
            "server": server,
            "database": database,
        }

        _store_connection_details(db_name, connection_name, fields)
        print("Done!")


def _store_connection_details(db_name, connection_name, fields):
    # find and remove sensitive data
    for field in fields:
        if field == "password":
            _store_password(connection_name, fields[field])
            break

    values = [fields[field] for field in fields]
    list_of_connections = _get_stored_connections()
    new_connection = dict({"name": connection_name, "db": db_name, "values": values})
    list_of_connections.append(new_connection)

    with open("connections.pkl", "wb") as f:
        pickle.dump(list_of_connections, f)


def _store_password(name, password):
    keyring.set_password("jupysql", name, password)


def _is_unique_connection_name(connection_name) -> bool:
    connections = _get_stored_connections()
    # is_exists = _get_connection_string_by_name(connections, connection_name)

    # if is_exists:
    #     display(
    #         HTML(
    #             f"""
    #         <script>
    #             alert("{connection_name} is already exists!")
    #         </script>
    #         """
    #         )
    #     )
    # return not is_exists
    return True


class ConnectorWidget(DOMWidget):
    """
    TODO: docstring
    """

    _model_name = Unicode("ConnectorModel").tag(sync=True)
    _model_module = Unicode(_module_name).tag(sync=True)
    _model_module_version = Unicode(__version__).tag(sync=True)
    _view_name = Unicode("ConnectorView").tag(sync=True)
    _view_module = Unicode(_module_name).tag(sync=True)
    _view_module_version = Unicode(__version__).tag(sync=True)

    stored_connections = _get_stored_connections()

    connections = Unicode(json.dumps(stored_connections)).tag(sync=True)
    connections_templates = Unicode(json.dumps(CONNECTIONS_TEMPLATES)).tag(sync=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.on_msg(self._handle_message)

    def _handle_message(self, widget, content, buffers):
        if "method" in content:
            method = content["method"]
            if method == "connect":
                connection = content["data"]
                self._connect(connection)
                self.send({"method": "connected", "message": connection["name"]})

            if method == "submit_new_connection":
                new_connection_data = content["data"]
                _create_new_connection(new_connection_data)

                self.stored_connections = _get_stored_connections()
                connections = json.dumps(self.stored_connections)
                self.send({"method": "update_connections", "message": connections})

    def _connect(self, connection):
        from sql.connection import Connection
        from sqlalchemy import create_engine

        name = connection["name"]
        db = connection["db"]
        values = connection["values"]
        print(f"Connection is {connection}")
        connection_string = _get_connection_string(db, values)

        print(f"connection_string is : {connection_string}")

        engine = create_engine(connection_string)
        Connection(engine=engine)
