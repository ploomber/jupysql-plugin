from jupysql_plugin import __version__, _module_name
from jupysql_plugin.widgets.db_templates import CONNECTIONS_TEMPLATES, DRIVER_TO_DBNAME
from jupysql_plugin.widgets.connections import (
    _serialize_connections,
    ConnectorWidgetManager,
)
from jupysql_plugin import exceptions

from ipywidgets import DOMWidget
from traitlets import Unicode, Dict
import json


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
    driver_to_dbname = Dict().tag(sync=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.widget_manager = ConnectorWidgetManager()
        self.stored_connections = self.widget_manager.get_connections_from_config_file()
        self.connections = _serialize_connections(self.stored_connections)
        self.connections_templates = json.dumps(CONNECTIONS_TEMPLATES)
        self.driver_to_dbname = DRIVER_TO_DBNAME

        self.on_msg(self._handle_message)

    def _handle_message(self, widget, content, buffers):
        """
        Handles messages from front
        """
        if "method" in content:
            method = content["method"]

            if method == "check_config_file":
                is_exist = self.widget_manager.is_config_exist()
                self.send({"method": "check_config_file", "message": is_exist})

            # user wants to delete connection
            elif method == "delete_connection":
                connection = content["data"]
                self.widget_manager.delete_section_with_name(connection["name"])
                self.send({"method": "deleted", "message": connection["name"]})

                self.stored_connections = (
                    self.widget_manager.get_connections_from_config_file()
                )
                connections = _serialize_connections(self.stored_connections)
                self.send({"method": "update_connections", "message": connections})

            # user wants to connect to a database that's been stored in the config file
            elif method == "connect":
                connection = content["data"]

                try:
                    self.widget_manager.connect_to_database_in_section(
                        connection_name=connection["name"]
                    )
                except Exception as e:
                    self.send_error_message_to_frontend(
                        method="connection_error", error=e
                    )
                else:
                    self.send({"method": "connected", "message": connection["name"]})

            # store a new connection in the config file and connect to it
            elif method == "submit_new_connection":
                new_connection_data = content["data"]
                connection_name = new_connection_data.get("connectionName")

                try:
                    connection_name = (
                        self.widget_manager.save_connection_to_config_file_and_connect(
                            new_connection_data
                        )
                    )
                except exceptions.ConnectionWithNameAlreadyExists as e:
                    self.send_error_message_to_frontend(
                        method="connection_name_exists_error", error=e
                    )
                except Exception as e:
                    self.send_error_message_to_frontend(
                        method="connection_error", error=e
                    )
                else:
                    self.send({"method": "connected", "message": connection_name})
                    self.stored_connections = (
                        self.widget_manager.get_connections_from_config_file()
                    )
                    connections = _serialize_connections(self.stored_connections)
                    self.send({"method": "update_connections", "message": connections})

            else:
                raise ValueError(f"Method {method} is not supported")
        else:
            raise ValueError("Method is not specified")

    def send_error_message_to_frontend(self, *, method, error):
        """Display an error message in the frontend

        Parameters
        ----------
        method : str
            The method to send to the frontend, this is used to determine how the
            frontend should react to the error.

        error : Exception
            The error to send to the frontend, the error type and message will be
            sent to the frontend.
        """
        error_type = error.__class__.__name__
        error_message = f"{error_type}: {str(error)}"
        self.send({"method": method, "message": error_message})
