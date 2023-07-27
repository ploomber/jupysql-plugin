from jupysql_plugin import __version__, _module_name

from ipywidgets import DOMWidget
from traitlets import Unicode
import json
from sqlalchemy import create_engine
from sql.parse import connection_from_dsn_section
from configparser import ConfigParser
from pathlib import Path

try:
    from sql.connection import SQLAlchemyConnection
except ImportError:
    # if using jupysql<0.9
    from sql.connection import Connection as SQLAlchemyConnection

CONNECTIONS_TEMPLATES = dict(
    {
        "sqlite": {
            "driver": "sqlite",
            "fields": [
                {
                    "id": "connectionName",
                    "label": "Connection alias",
                    "type": "text",
                },
            ],
            "connection_string": "sqlite://",
        },
        "duckdb": {
            "driver": "duckdb",
            "fields": [
                {
                    "id": "connectionName",
                    "label": "Connection alias",
                    "type": "text",
                },
            ],
            "connection_string": "duckdb://",
        },
        "postgresql": {
            "driver": "postgresql",
            "fields": [
                {
                    "id": "connectionName",
                    "label": "Connection alias",
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
        },
        "mysql": {
            "driver": "mysql+pymysql",
            "fields": [
                {
                    "id": "connectionName",
                    "label": "Connection alias",
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
                {"id": "port", "label": "Port", "type": "number"},
                {"id": "database", "label": "Database", "type": "text"},
            ],
        },
        "mariaDB": {
            "driver": "mysql+pymysql",
            "fields": [
                {
                    "id": "connectionName",
                    "label": "Connection alias",
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
                {"id": "port", "label": "Port", "type": "number"},
                {"id": "database", "label": "Database", "type": "text"},
            ],
        },
        "snowflake": {
            "driver": "snowflake",
            "fields": [
                {
                    "id": "connectionName",
                    "label": "Connection alias",
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
        },
    }
)

CONFIG_FILE = "connections.ini"


def _serialize_connections(connections):
    """
    Returns connections object as JSON
    """
    return json.dumps(connections)


def _get_connection_string(connection_name) -> str:
    """
    Returns connection string
    """

    class Config:
        dsn_filename = Path(CONFIG_FILE)

    connection_string = connection_from_dsn_section(
        section=connection_name, config=Config()
    )

    return connection_string


def _get_stored_connections() -> list:
    """
    Returns a list of stored connections
    """
    connections = []
    config = _get_config_file()
    sections = config.sections()
    if len(sections) > 0:
        connections = [{"name": s, "driver": config[s]["drivername"]} for s in sections]

    return connections


def is_config_exist() -> bool:
    return Path(CONFIG_FILE).is_file()


def _store_connection_details(connection_name, fields):
    """
    Stores connection in the config file
    """
    # add section test
    config = _get_config_file()
    config.add_section(connection_name)

    for field in fields:
        if fields[field]:
            config.set(connection_name, field, fields[field])

    with open(CONFIG_FILE, "w") as config_file:
        config.write(config_file)


def _create_new_connection(new_connection_data):
    """
    Creates new connection and stores it in the configuration file

    Returns connection object
    """
    connection_name = new_connection_data.get("connectionName")
    driver_name = new_connection_data.get("driver")

    database = new_connection_data.get("database")
    password = new_connection_data.get("password")
    host = new_connection_data.get("host")
    user_name = new_connection_data.get("username")
    port = new_connection_data.get("port")

    fields_config = {
        "username": user_name,
        "password": password,
        "host": host,
        "database": database,
        "drivername": driver_name,
        "port": port,
    }

    _store_connection_details(connection_name, fields_config)

    connection = {
        "name": connection_name,
        "driver": database,
    }
    return connection


def _is_unique_connection_name(connection_name) -> bool:
    config = _get_config_file()
    is_exists = connection_name in config.sections()

    return not is_exists


def _get_config_file() -> ConfigParser:
    """
    Returns current config file
    """
    config = ConfigParser()
    config.read(CONFIG_FILE)
    return config


class ConnectorWidget(DOMWidget):
    """
    Manage database connections
    """

    _model_name = Unicode("ConnectorModel").tag(sync=True)
    _model_module = Unicode(_module_name).tag(sync=True)
    _model_module_version = Unicode(__version__).tag(sync=True)
    _view_name = Unicode("ConnectorView").tag(sync=True)
    _view_module = Unicode(_module_name).tag(sync=True)
    _view_module_version = Unicode(__version__).tag(sync=True)

    stored_connections = _get_stored_connections()

    connections = Unicode(_serialize_connections(stored_connections)).tag(sync=True)
    connections_templates = Unicode(json.dumps(CONNECTIONS_TEMPLATES)).tag(sync=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.on_msg(self._handle_message)

    def _handle_message(self, widget, content, buffers):
        """
        Handles messages from front
        """
        if "method" in content:
            method = content["method"]

            if method == "check_config_file":
                is_exist = is_config_exist()
                self.send({"method": "check_config_file", "message": is_exist})

            if method == "delete_connection":
                connection = content["data"]
                self._delete_connection(connection)
                self.send({"method": "deleted", "message": connection["name"]})

                self.stored_connections = _get_stored_connections()
                connections = _serialize_connections(self.stored_connections)
                self.send({"method": "update_connections", "message": connections})

            if method == "connect":
                try:
                    connection = content["data"]
                    self._connect(connection)
                    self.send({"method": "connected", "message": connection["name"]})
                except Exception as e:
                    self.send_error_message_to_front(e)

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
                    connections = _serialize_connections(self.stored_connections)
                    self.send({"method": "update_connections", "message": connections})
                    try:
                        self._connect(connection)
                        self.send(
                            {"method": "connected", "message": connection["name"]}
                        )
                    except Exception as e:
                        self.send_error_message_to_front(e)

    def send_error_message_to_front(self, error):
        error_prefix = error.__class__.__name__
        error_message = f"{error_prefix} : {str(error)}"
        self.send({"method": "connection_error", "message": error_message})

    def _connect(self, connection):
        """
        Connects to database
        """
        name = connection["name"]
        connection_string = _get_connection_string(name)

        engine = create_engine(connection_string)
        SQLAlchemyConnection(engine=engine, alias=name)

    def _delete_connection(self, connection):
        """
        Delets connection from ini file
        """
        connection_name = connection["name"]

        config = _get_config_file()

        with open(CONFIG_FILE, "r") as f:
            config.readfp(f)

        config.remove_section(connection_name)

        with open(CONFIG_FILE, "w") as f:
            config.write(f)
