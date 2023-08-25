from unittest.mock import ANY
from pathlib import Path

import pytest
from jupysql_plugin.widgets import connections
from sql.connection import ConnectionManager


@pytest.mark.parametrize(
    "config_file, expected",
    [
        (
            "",
            [],
        ),
        (
            """
[duck]
drivername = duckdb
""",
            [
                {"driver": "duckdb", "name": "duck"},
            ],
        ),
        (
            """
[duck]
drivername = duckdb

[sqlite]
drivername = sqlite
""",
            [
                {"driver": "duckdb", "name": "duck"},
                {"driver": "sqlite", "name": "sqlite"},
            ],
        ),
    ],
    ids=[
        "empty",
        "one",
        "two",
    ],
)
def test_get_connections_from_config_file(tmp_empty, config_file, expected):
    Path("jupysql-plugin.ini").write_text(config_file)

    assert (
        connections.ConnectorWidgetManager().get_connections_from_config_file()
        == expected
    )


@pytest.mark.parametrize(
    "data, expected",
    [
        (
            {
                "connectionName": "duck",
                "driver": "duckdb",
            },
            """\
[duck]
drivername = duckdb

""",
        ),
        (
            {
                "connectionName": "pg",
                "driver": "postgresql",
                "database": "db",
                "password": "pass",
                "host": "db.corp.com",
                "username": "user",
                "port": "5432",
            },
            """\
[pg]
username = user
password = pass
host = db.corp.com
database = db
drivername = postgresql
port = 5432

""",
        ),
    ],
)
def test_create_new_connection(tmp_empty, data, expected):
    manager = connections.ConnectorWidgetManager()
    # do not connect because the db details are invalid
    manager.save_connection_to_config_file_and_connect(data, connect=False)
    content = Path("jupysql-plugin.ini").read_text()
    assert content == expected


@pytest.mark.parametrize(
    "dsn_filename",
    [
        "jupysql-plugin.ini",
        "path/to/jupysql-plugin.ini",
    ],
    ids=[
        "default",
        "nested",
    ],
)
def test_save_connection_to_config_file(tmp_empty, override_sql_magic, dsn_filename):
    override_sql_magic.dsn_filename = dsn_filename

    manager = connections.ConnectorWidgetManager()
    manager.save_connection_to_config_file_and_connect(
        {
            "driver": "duckdb",
            "connectionName": "somedb",
            "database": ":memory:",
        }
    )

    assert ConnectionManager.connections == {"somedb": ANY}
    assert "[somedb]" in Path(dsn_filename).read_text()


def test_delete_section_with_name(tmp_empty):
    Path("jupysql-plugin.ini").write_text(
        """
[duck]
drivername = duckdb

[sqlite]
drivername = sqlite
"""
    )

    manager = connections.ConnectorWidgetManager()

    manager.delete_section_with_name("duck")

    expected = """
[sqlite]
drivername = sqlite
""".strip()

    assert Path("jupysql-plugin.ini").read_text().strip() == expected
