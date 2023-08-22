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
