from jupysql_plugin import __version__, _module_name
from jupysql_plugin.widgets.db_templates import CONNECTIONS_TEMPLATES
from jupysql_plugin.widgets.connections import (
    _create_new_connection,
    _get_config_file,
    get_path_to_config_file,
)

from ipywidgets import DOMWidget
from traitlets import Unicode
import json
from pathlib import Path


try:
    # renamed in jupysql 0.9.0
    from sql.connection import ConnectionManager

    # this was renamed in jupysql 0.10.0
    from sql.parse import connection_str_from_dsn_section
except (ModuleNotFoundError, ImportError) as e:
    raise ModuleNotFoundError(
        "Your jupysql version isn't compatible with this version of jupysql-plugin. "
        "Please update: pip install jupysql --upgrade"
    ) from e


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
        dsn_filename = Path(get_path_to_config_file())

    connection_string = connection_str_from_dsn_section(
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
    return Path(get_path_to_config_file()).is_file()


def _is_unique_connection_name(connection_name) -> bool:
    config = _get_config_file()
    is_exists = connection_name in config.sections()

    return not is_exists


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

    connections = Unicode().tag(sync=True)
    connections_templates = Unicode().tag(sync=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.stored_connections = _get_stored_connections()
        self.connections = _serialize_connections(self.stored_connections)
        self.connections_templates = json.dumps(CONNECTIONS_TEMPLATES)

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

            # user wants to delete connection
            elif method == "delete_connection":
                connection = content["data"]
                self._delete_connection(connection)
                self.send({"method": "deleted", "message": connection["name"]})

                self.stored_connections = _get_stored_connections()
                connections = _serialize_connections(self.stored_connections)
                self.send({"method": "update_connections", "message": connections})

            # user wants to connect to a database that's been stored in the config file
            elif method == "connect":
                connection = content["data"]

                try:
                    self._connect(connection)
                except Exception as e:
                    self.send_error_message_to_front(e)
                else:
                    self.send({"method": "connected", "message": connection["name"]})

            # store a new connection in the config file and connect to it
            elif method == "submit_new_connection":
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
                    except Exception as e:
                        self.send_error_message_to_front(e)
                    else:
                        self.send(
                            {"method": "connected", "message": connection["name"]}
                        )

            else:
                raise ValueError(f"Method {method} is not supported")
        else:
            raise ValueError("Method is not specified")

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

        # this method contains the error handling logic that helps the user diagnose
        # connection errors so we use this instead of the SQLAlchemy/DBAPIConnection
        # constructor
        ConnectionManager.set(connection_string, alias=name, displaycon=False)

    def _delete_connection(self, connection):
        """
        Delets connection from ini file
        """
        connection_name = connection["name"]

        config = _get_config_file()

        with open(get_path_to_config_file(), "r") as f:
            config.readfp(f)

        config.remove_section(connection_name)

        with open(get_path_to_config_file(), "w") as f:
            config.write(f)
