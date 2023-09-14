import nox

from os import environ


@nox.session(
    python=environ.get("PYTHON_VERSION", "3.11"),
)
def test(session):
    session.run("python", "--version")
    session.install("-r", "requirements.txt")
    session.install("-r", "requirements.dev.txt")

    # our tests assume that the cell toolbar is hidden
    session.run(
        "jupyter", "labextension", "disable", "@jupyterlab/cell-toolbar-extension"
    )

    # on github actions, we often get a timeout when installing the dependencies
    session.run("jlpm", "config", "set", "network-timeout", "600000", "-g")

    session.run("jlpm", "install")
    session.install("-e", ".")
    session.run("python", "-c", "import jupysql_plugin")

    # unit tests
    session.run("pytest", "tests")

    session.run("jlpm", "test")

    with session.chdir("ui-tests"):
        session.run("jlpm", "install")
        # TODO: this will install all playwright browsers, but we only need one
        session.run("jlpm", "playwright", "install")
        session.run("jlpm", "test")
