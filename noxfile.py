import nox

from yaml import safe_load
from pathlib import Path

# https://github.com/wntrblm/nox/issues/260#issuecomment-932966572
environment = safe_load(Path("environment.dev.yml").read_text())
conda = environment.get("dependencies")
requirements = conda.pop(-1).get("pip")


def install_environment(session):
    for conda_pkg in conda:
        session.conda_install(conda_pkg)
    for pkg in requirements:
        session.install(*pkg.split())
    session.install("-e", ".")


@nox.session(venv_backend="conda")
def build(session):
    install_environment(session)
