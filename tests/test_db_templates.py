import pytest

from jupysql_plugin.widgets.db_templates import CONNECTIONS_TEMPLATES


@pytest.mark.parametrize(
    "key,expected",
    [
        (
            "DuckDB",
            {
                "driver": "duckdb",
                "fields": [
                    {
                        "id": "connectionName",
                        "label": "Connection alias",
                        "type": "text",
                        "default": "duckdb",
                    },
                    {
                        "id": "database",
                        "label": "Path to database",
                        "type": "text",
                        "default": ":memory:",
                    },
                ],
            },
        ),
        (
            "SQLite",
            {
                "driver": "sqlite",
                "fields": [
                    {
                        "id": "connectionName",
                        "label": "Connection alias",
                        "type": "text",
                        "default": "sqlite",
                    },
                    {
                        "id": "database",
                        "label": "Path to database",
                        "type": "text",
                        "default": ":memory:",
                    },
                ],
            },
        ),
        (
            "PostgreSQL",
            {
                "driver": "postgresql",
                "fields": [
                    {
                        "id": "connectionName",
                        "label": "Connection alias",
                        "type": "text",
                        "default": "postgresql",
                    },
                    {"id": "username", "label": "Username", "type": "text"},
                    {"id": "password", "label": "Password", "type": "password"},
                    {"id": "host", "label": "Host", "type": "text"},
                    {"id": "database", "label": "Database", "type": "text"},
                    {"id": "port", "label": "Port", "type": "number", "default": 5432},
                ],
            },
        ),
    ],
)
def test_templates(key, expected):
    assert CONNECTIONS_TEMPLATES[key] == expected
