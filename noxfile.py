from pathlib import Path
from os import environ

import nox
from yaml import safe_load


# TODO: looks like it's still installing python 3.11 for all tests
def load_dependencies():
    conda = safe_load(Path("environment.yml").read_text())["dependencies"]
    requirements = conda.pop(-1).get("pip")
    conda = [pkg for pkg in conda if not pkg.startswith("python")]

    return conda, requirements


def install_environment(session):
    conda, requirements = load_dependencies()
    session.conda_install(*conda)
    session.install(*requirements)


@nox.session(
    venv_backend="conda",
    python=environ.get("PYTHON_VERSION", "3.11"),
)
def test(session):
    install_environment(session)
    # our tests assume that the cell toolbar is hidden
    session.run(
        "jupyter", "labextension", "disable", "@jupyterlab/cell-toolbar-extension"
    )
    session.run("python", "--version")

    # on github actions, we often get a timeout when installing the dependencies
    session.run("jlpm", "config", "set", "network-timeout", "600000", "-g")

    session.run("jlpm", "install")
    session.install("-e", ".")
    session.run("python", "-c", "import jupysql_plugin")

    session.run("jlpm", "test")

    with session.chdir("ui-tests"):
        session.run("jlpm", "install")
        # TODO: this will install all playwright browsers, but we only need one
        session.run("jlpm", "playwright", "install")
        session.run("jlpm", "test")
