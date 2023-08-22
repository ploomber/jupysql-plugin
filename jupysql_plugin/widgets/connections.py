from configparser import ConfigParser


try:
    # this was added in jupysql 0.10.0
    from sql._current import _get_sql_magic
except (ModuleNotFoundError, ImportError) as e:
    raise ModuleNotFoundError(
        "Your jupysql version isn't compatible with this version of jupysql-plugin. "
        "Please update: pip install jupysql --upgrade"
    ) from e


def get_path_to_config_file():
    """
    Returns config file path
    """
    return _get_sql_magic().dsn_filename


def _get_config_file() -> ConfigParser:
    """
    Returns current config file
    """
    config = ConfigParser()

    config.read(get_path_to_config_file())
    return config


def _store_connection_details(connection_name, fields):
    """
    Stores connection in the config file
    """
    config = _get_config_file()
    config.add_section(connection_name)

    for field in fields:
        if fields[field]:
            config.set(connection_name, field, fields[field])

    with open(get_path_to_config_file(), "w") as config_file:
        config.write(config_file)


def _create_new_connection(new_connection_data):
    """
    Creates new connection and stores it in the configuration file

    Returns connection object
    """
    connection_name = new_connection_data["connectionName"]
    driver_name = new_connection_data["driver"]

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
