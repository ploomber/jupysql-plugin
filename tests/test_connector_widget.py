from pathlib import Path

import pytest
from sql.connection import ConnectionManager

from jupysql_plugin.widgets.connector_widget import ConnectorWidget


class ConnectorWidgetTesting(ConnectorWidget):
    """A class to test ConnectorWidget methods"""

    def send_error_message_to_front(self, error):
        """The original implementation sends a message to the frontend, here,
        we raise an error instead
        """
        raise error


def test_method_missing():
    with pytest.raises(ValueError) as excinfo:
        ConnectorWidgetTesting()._handle_message(None, {}, None)

    assert "Method is not specified" == str(excinfo.value)


def test_method_unknown():
    with pytest.raises(ValueError) as excinfo:
        ConnectorWidgetTesting()._handle_message(None, {"method": "not-a-method"}, None)

    assert "Method not-a-method is not supported" == str(excinfo.value)


def test_method_submit_new_connection(tmp_empty):
    ConnectorWidgetTesting()._handle_message(
        None,
        {
            "method": "submit_new_connection",
            "data": {"connectionName": "duck", "driver": "duckdb"},
        },
        None,
    )

    assert set(ConnectionManager.connections) == {"duck"}


@pytest.mark.parametrize(
    "data, expected",
    [
        (
            {
                "connectionName": "duck",
                "driver": "duckdb",
                "database": "duck.db",
            },
            """\
[duck]
database = duck.db
drivername = duckdb

""",
        ),
    ],
)
def test_method_submit_new_connection_path(tmp_empty, data, expected):
    ConnectorWidgetTesting()._handle_message(
        None,
        {
            "method": "submit_new_connection",
            "data": data,
        },
        None,
    )

    config = Path("odbc.ini").read_text()

    assert config == expected
    assert set(ConnectionManager.connections) == {"duck"}


def test_method_connect(tmp_empty):
    Path("odbc.ini").write_text(
        """
[duck]
drivername = duckdb
"""
    )

    ConnectorWidgetTesting()._handle_message(
        None,
        {
            "method": "connect",
            "data": {"name": "duck"},
        },
        None,
    )

    assert set(ConnectionManager.connections) == {"duck"}
