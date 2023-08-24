from pathlib import Path

import pytest
from jupysql_plugin.widgets import connections


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
    connections._create_new_connection(data)
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
def test_store_connection_details(tmp_empty, override_sql_magic, dsn_filename):
    override_sql_magic.dsn_filename = dsn_filename

    connections._store_connection_details("some_connection", {"drivername": "duckdb"})

    assert (
        Path(dsn_filename).read_text()
        == """\
[some_connection]
drivername = duckdb

"""
    )
