import os
from pathlib import Path

import pytest
from IPython import InteractiveShell

from sql.magic import SqlMagic, _set_sql_magic
from sql import connection

# currently the connection widget loads the config when importing the module
# so we need to ensure the magic is initialized before importing the widget
shell = InteractiveShell()
sql_magic = SqlMagic(shell)
_set_sql_magic(sql_magic)


@pytest.fixture(scope="function", autouse=True)
def isolate_tests(monkeypatch):
    """
    Fixture to ensure connections are isolated between tests, preventing tests
    from accidentally closing connections created by other tests.

    Also clear up any stored snippets.
    """
    # reset connections
    connections = {}
    monkeypatch.setattr(connection.ConnectionManager, "connections", connections)
    monkeypatch.setattr(connection.ConnectionManager, "current", None)

    yield

    # close connections
    connection.ConnectionManager.close_all()


@pytest.fixture
def tmp_empty(tmp_path):
    """
    Create temporary path using pytest native fixture,
    them move it, yield, and restore the original path
    """

    old = os.getcwd()
    os.chdir(str(tmp_path))
    yield str(Path(tmp_path).resolve())
    os.chdir(old)
