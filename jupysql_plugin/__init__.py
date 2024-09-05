from ._version import __version__  # noqa: F401

_module_name = "jupysql-plugin"


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "jupysql-plugin"}]


def _jupyter_server_extension_points():
    return [{"module": "jupysql_plugin"}]


def _load_jupyter_server_extension(serverapp):
    """
    This function is called when the extension is loaded.
    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    serverapp.log.info(f"Registered {_module_name} server extension")


load_jupyter_server_extension = _load_jupyter_server_extension
