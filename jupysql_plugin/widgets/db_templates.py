DRIVER_TO_DBNAME = {
    "duckdb": "DuckDB",
    "sqlite": "SQLite",
    "postgresql": "PostgreSQL",
    "mysql+pymysql": "MySQL",
    "snowflake": "Snowflake",
    "mariadb": "MariaDB",
    "oracle+oracledb": "Oracle",
    "mssql+pyodbc": "MSSQL",
    "redshift+redshift_connector": "Redshift",
}

CONNECTIONS_TEMPLATES = dict(
    {
        "DuckDB": {
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
        "SQLite": {
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
        "PostgreSQL": {
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
                    "label": "Username",
                    "type": "text",
                },
                {
                    "id": "password",
                    "label": "Password",
                    "type": "password",
                },
                {
                    "id": "host",
                    "label": "Host",
                    "type": "text",
                },
                {
                    "id": "database",
                    "label": "Database",
                    "type": "text",
                },
                {
                    "id": "port",
                    "label": "Port",
                    "type": "number",
                    "default": 5432,
                },
            ],
        },
        "MySQL": {
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
                    "label": "Username",
                    "type": "text",
                },
                {
                    "id": "password",
                    "label": "Password",
                    "type": "password",
                },
                {
                    "id": "host",
                    "label": "Host",
                    "type": "text",
                },
                {
                    "id": "port",
                    "label": "Port",
                    "type": "number",
                    "default": 3306,
                },
                {
                    "id": "database",
                    "label": "Database",
                    "type": "text",
                },
            ],
        },
        "MariaDB": {
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
                    "label": "Username",
                    "type": "text",
                },
                {
                    "id": "password",
                    "label": "Password",
                    "type": "password",
                },
                {
                    "id": "host",
                    "label": "Host",
                    "type": "text",
                },
                {
                    "id": "port",
                    "label": "Port",
                    "type": "number",
                    "default": 3306,
                },
                {
                    "id": "database",
                    "label": "Database",
                    "type": "text",
                },
            ],
        },
        "Snowflake": {
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
                    "label": "Username",
                    "type": "text",
                },
                {
                    "id": "password",
                    "label": "Password",
                    "type": "password",
                },
                {
                    "id": "host",
                    "label": "Host",
                    "type": "text",
                },
                {
                    "id": "port",
                    "label": "Port",
                    "type": "number",
                    "default": 443,
                },
                {
                    "id": "database",
                    "label": "Database",
                    "type": "text",
                },
            ],
        },
        "Oracle": {
            "driver": "oracle+oracledb",
            "fields": [
                {
                    "id": "connectionName",
                    "label": "Connection alias",
                    "type": "text",
                    "default": "oracle",
                },
                {
                    "id": "username",
                    "label": "Username",
                    "type": "text",
                },
                {
                    "id": "password",
                    "label": "Password",
                    "type": "password",
                },
                {
                    "id": "host",
                    "label": "Host",
                    "type": "text",
                },
                {
                    "id": "database",
                    "label": "Database",
                    "type": "text",
                },
                {
                    "id": "port",
                    "label": "Port",
                    "type": "number",
                    "default": 1521,
                },
            ],
        },
        "MSSQL": {
            "driver": "mssql+pyodbc",
            "fields": [
                {
                    "id": "connectionName",
                    "label": "Connection alias",
                    "type": "text",
                    "default": "mssql",
                },
                {
                    "id": "username",
                    "label": "Username",
                    "type": "text",
                },
                {
                    "id": "password",
                    "label": "Password",
                    "type": "password",
                },
                {
                    "id": "host",
                    "label": "Host",
                    "type": "text",
                },
                {
                    "id": "database",
                    "label": "Database",
                    "type": "text",
                },
                {
                    "id": "port",
                    "label": "Port",
                    "type": "number",
                    "default": 1433,
                },
            ],
        },
        "Redshift": {
            "driver": "redshift+redshift_connector",
            "fields": [
                {
                    "id": "connectionName",
                    "label": "Connection alias",
                    "type": "text",
                    "default": "redshift",
                },
                {
                    "id": "username",
                    "label": "Username",
                    "type": "text",
                },
                {
                    "id": "password",
                    "label": "Password",
                    "type": "password",
                },
                {
                    "id": "host",
                    "label": "Host",
                    "type": "text",
                },
                {
                    "id": "database",
                    "label": "Database",
                    "type": "text",
                },
                {
                    "id": "port",
                    "label": "Port",
                    "type": "number",
                    "default": 5439,
                },
            ],
        },
    }
)
