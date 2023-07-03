from ._version import __version__  # noqa: F401
from .server_handlers.dashboard import setup_handlers

_module_name = "jupysql-plugin"


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "jupysql-plugin"}]


def _jupyter_server_extension_paths():
    return [{"module": "jupysql_plugin"}]


def _load_jupyter_server_extension(server_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.
    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    setup_handlers(server_app.web_app)
    server_app.log.info(f"Registered {_module_name} server extension")


load_jupyter_server_extension = _load_jupyter_server_extension
