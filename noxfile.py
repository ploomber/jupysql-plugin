import nox

from yaml import safe_load
from pathlib import Path

# https://github.com/wntrblm/nox/issues/260#issuecomment-932966572
environment = safe_load(Path("environment.dev.yml").read_text())
conda = environment.get("dependencies")
requirements = conda.pop(-1).get("pip")


def install_environment(session):
    session.conda_install(*conda)
    session.install(*requirements)


# NOTE: python=3.11 is hardcoded in the environment.dev.yml
@nox.session(venv_backend="conda")
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
