import json
from configparser import ConfigParser
from pathlib import Path

from sqlalchemy.engine.url import URL

try:
    # renamed in jupysql 0.9.0
    from sql.connection import ConnectionManager

    # this was added in jupysql 0.10.0
    from sql._current import _get_sql_magic

    # this was renamed in jupysql 0.10.0
    from sql.parse import connection_str_from_dsn_section
except (ModuleNotFoundError, ImportError) as e:
    raise ModuleNotFoundError(
        "Your jupysql version isn't compatible with this version of jupysql-plugin. "
        "Please update: pip install jupysql --upgrade"
    ) from e


from jupysql_plugin import exceptions


class ConnectorWidgetManager:
    """
    Used by the ConnectorWidget to manage database connections and
    configuration file
    """

    def get_path_to_config_file(self) -> str:
        """
        Returns config file path
        """
        return _get_sql_magic().dsn_filename

    def is_config_exist(self) -> bool:
        """Returns True if the config file exists, False otherwise"""
        return Path(self.get_path_to_config_file()).is_file()

    def _get_config(self) -> ConfigParser:
        """
        Returns current config file
        """
        config = ConfigParser()

        config.read(self.get_path_to_config_file())
        return config

    def _get_connection_string_from_section_in_config_file(
        self, connection_name
    ) -> str:
        """
        Reads the desired section from the config file and returns the connection
        string
        """

        class Config:
            dsn_filename = Path(self.get_path_to_config_file())

        connection_string = connection_str_from_dsn_section(
            section=connection_name, config=Config()
        )

        return connection_string

    def section_name_already_exists(self, connection_name) -> bool:
        config = ConnectorWidgetManager()._get_config()
        return connection_name in config.sections()

    def get_connections_from_config_file(self) -> list:
        """
        Return the list of connections (dictionaries) from the configuration file
        """
        connections = []
        config = self._get_config()

        def _config_section_to_dict(config, section):
            d = dict(config.items(section))
            d["name"] = section

            if "drivername" in d:
                d["driver"] = d.pop("drivername")

            return d

        connections = [
            _config_section_to_dict(config, section) for section in config.sections()
        ]

        return connections

    def save_connection_to_config_file_and_connect(
        self,
        connection_data,
        *,
        connect=True,
    ):
        """
        Connects to the database specified in the connection_data. If connection
        succeeds, saves the connection to the config file.

        Parameters
        ----------
        connection_data: dict
            Dictionary with connection details

        connect: bool
            If True, will attempt to connect to the database

        Returns
        -------
        connection_name: str
            Name of the connection

        Raises
        ------
        Exception
            If the connection fails to establish
        """
        connection_name = connection_data["connectionName"]
        existing_alias = connection_data.get("existingConnectionAlias")
        changed_alias = existing_alias != connection_name

        if changed_alias and self.section_name_already_exists(connection_name):
            raise exceptions.ConnectionWithNameAlreadyExists(connection_name)

        driver_name = connection_data["driver"]

        database = connection_data.get("database")
        password = connection_data.get("password")
        host = connection_data.get("host")
        user_name = connection_data.get("username")
        port = connection_data.get("port")

        url_data = {
            "username": user_name,
            "password": password,
            "host": host,
            "database": database,
            "drivername": driver_name,
            "port": port,
        }

        # before updating the config file, we need to make sure that the connection
        # details are valid
        if connect:
            connection_str = str(
                URL.create(**url_data).render_as_string(hide_password=False)
            )

            self.connect_to_database(connection_str, connection_name)

        self._save_new_section_to_config_file(connection_name, url_data, existing_alias)

        return connection_name

    def _save_new_section_to_config_file(
        self, connection_name, connection_data, existing_alias
    ):
        """
        Stores connection in the config file
        """
        config = ConnectorWidgetManager()._get_config()

        if existing_alias:
            del config[existing_alias]

        config[connection_name] = {k: v for k, v in connection_data.items() if v}

        path_to_config_file = Path(ConnectorWidgetManager().get_path_to_config_file())

        if not path_to_config_file.parent.exists():
            path_to_config_file.parent.mkdir(parents=True)

        with open(path_to_config_file, "w") as config_file:
            config.write(config_file)

    def connect_to_database_in_section(self, *, connection_name):
        """
        Connect to a database by reading a given section from the connections file.
        """
        connection_string = self._get_connection_string_from_section_in_config_file(
            connection_name
        )

        self.connect_to_database(connection_string, connection_name)

    def connect_to_database(self, connection_str, connection_name):
        """Connect to a database using a connection string and alias"""
        # this method contains the error handling logic that helps the user diagnose
        # connection errors so we use this instead of the SQLAlchemy/DBAPIConnection
        # constructor
        ConnectionManager.set(connection_str, alias=connection_name, displaycon=False)

    def delete_section_with_name(self, section_name):
        """
        Deletes section from connections file
        """

        config = ConnectorWidgetManager()._get_config()

        with open(ConnectorWidgetManager().get_path_to_config_file(), "r") as f:
            config.readfp(f)

        config.remove_section(section_name)

        with open(ConnectorWidgetManager().get_path_to_config_file(), "w") as f:
            config.write(f)


def _serialize_connections(connections):
    """
    Returns connections object as JSON
    """
    return json.dumps(connections)
