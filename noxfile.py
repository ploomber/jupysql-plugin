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
    session.run("python", "--version")
    session.run("python", "-c", "import jupysql_plugin")
    session.run("jlpm", "install")
    session.install("-e", ".")

    session.run("jlpm", "test")

    with session.chdir("ui-tests"):
        session.run("jlpm", "install")
        session.run("jlpm", "playwright", "install")
        session.run("jlpm", "test")
