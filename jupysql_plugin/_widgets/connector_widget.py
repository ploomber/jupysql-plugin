from jupysql_plugin import __version__, _module_name

from ipywidgets import DOMWidget
from traitlets import Unicode
import json
from sql.connection import Connection
from sqlalchemy import create_engine
from sql.parse import connection_from_dsn_section
from configparser import ConfigParser

CONNECTIONS_TEMPLATES = dict(
    {
        "sqlite": {
            "fields": [
                {
                    "id": "connectionName",
                    "label": "Connection name",
                    "type": "text",
                },
            ],
            "connection_string": "sqlite://",
        },
        "duckdb": {
            "fields": [
                {
                    "id": "connectionName",
                    "label": "Connection name",
                    "type": "text",
                },
            ],
            "connection_string": "duckdb://",
        },
        "postgresql": {
            "fields": [
                {
                    "id": "connectionName",
                    "label": "Connection name",
                    "type": "text",
                },
                {
                    "id": "username",
                    "label": "User name",
                    "type": "text",
                },
                {
                    "id": "password",
                    "label": "Password",
                    "type": "password",
                },
                {"id": "host", "label": "Host", "type": "text"},
                {"id": "database", "label": "Database", "type": "text"},
            ],
            "connection_string": "postgresql://{0}:{1}@{2}/{3}",
        },
    }
)

CONFIG_FILE = "connections.ini"


def serialize_connections(connections):
    """
    Returns connections object as JSON
    """
    return json.dumps(connections)


def _get_predefined_connections():
    return [
        {"name": "DuckDB", "driver": "duckdb"},
        {"name": "SQLite", "driver": "sqlite"},
    ]


def _get_connection_string(connection_name):
    connection_string = _get_connection_string_from_config(connection_name)
    return connection_string


def _get_stored_connections():
    connections = _get_stored_connections_config()
    return connections


def _store_connection_details(connection_name, fields):
    connection_string = _store_connection_details_config(connection_name, fields)
    return connection_string


def _create_new_connection(new_connection_data):
    connection_name = new_connection_data.get("connectionName")
    driver_name = new_connection_data.get("driver")

    database = new_connection_data.get("database")
    password = new_connection_data.get("password")
    host = new_connection_data.get("host")
    user_name = new_connection_data.get("username")

    fields_config = {
        "username": user_name,
        "password": password,
        "host": host,
        "database": database,
        "drivername": driver_name,
    }

    _store_connection_details(connection_name, fields_config)

    connection = {
        "name": connection_name,
        "driver": database,
    }
    return connection


def _is_unique_connection_name(connection_name) -> bool:
    config = ConfigParser()
    config.read(CONFIG_FILE)
    is_exists = connection_name in config.sections()

    return not is_exists


class Config:
    from pathlib import Path

    dsn_filename = Path(CONFIG_FILE)


def _get_stored_connections_config():
    connections = []
    config = ConfigParser()
    config.read(CONFIG_FILE)
    sections = config.sections()
    if len(sections) > 0:
        connections = [{"name": s, "driver": config[s]["drivername"]} for s in sections]
    else:
        connections = _get_predefined_connections()
        for connection in connections:
            _store_connection_details_config(
                connection["name"], dict({"drivername": connection["driver"]})
            )
    return connections


def _store_connection_details_config(connection_name, fields):
    # add section test
    config = ConfigParser()
    config.read(CONFIG_FILE)
    config.add_section(connection_name)

    for field in fields:
        if fields[field]:
            config.set(connection_name, field, fields[field])

    with open(CONFIG_FILE, "w") as config_file:
        config.write(config_file)


def _get_connection_string_from_config(name):
    connection_string = connection_from_dsn_section(section=name, config=Config())
    return connection_string


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

    connections = Unicode(serialize_connections(stored_connections)).tag(sync=True)
    connections_templates = Unicode(json.dumps(CONNECTIONS_TEMPLATES)).tag(sync=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.on_msg(self._handle_message)

    def _handle_message(self, widget, content, buffers):
        if "method" in content:
            method = content["method"]

            if method == "delete_connection":
                connection = content["data"]
                self._delete_connection(connection)
                self.send({"method": "deleted", "message": connection["name"]})

                self.stored_connections = _get_stored_connections()
                connections = serialize_connections(self.stored_connections)
                self.send({"method": "update_connections", "message": connections})

            if method == "connect":
                connection = content["data"]
                self._connect(connection)
                self.send({"method": "connected", "message": connection["name"]})

            if method == "submit_new_connection":
                new_connection_data = content["data"]
                connection_name = new_connection_data.get("connectionName")
                is_unique_name = _is_unique_connection_name(connection_name)

                if not is_unique_name:
                    self.send(
                        {
                            "method": "connection_name_exists_error",
                            "message": connection_name,
                        }
                    )
                else:
                    connection = _create_new_connection(new_connection_data)
                    self.stored_connections = _get_stored_connections()
                    connections = serialize_connections(self.stored_connections)
                    self.send({"method": "update_connections", "message": connections})

                    self._connect(connection)
                    self.send({"method": "connected", "message": connection["name"]})

    def _connect(self, connection):
        name = connection["name"]
        connection_string = _get_connection_string(name)

        engine = create_engine(connection_string)
        Connection(engine=engine)

    def _delete_connection(self, connection):
        """
        Delets connection from ini file
        """
        connection_name = connection["name"]

        config = ConfigParser()
        config.read(CONFIG_FILE)

        with open(CONFIG_FILE, "r") as f:
            config.readfp(f)

        config.remove_section(connection_name)

        with open(CONFIG_FILE, "w") as f:
            config.write(f)
