CONNECTIONS_TEMPLATES = dict(
    {
        "sqlite": {
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
                    "default": "duckdb",
                },
                {
                    "id": "database",
                    "label": "Path to database",
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
                    "default": "postgresql",
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
                    "default": "mysql",
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
                    "default": "mariadb",
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
                    "default": "snowflake",
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
