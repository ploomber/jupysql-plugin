from ._version import __version__  # noqa: F401


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "jupysql-plugin"}]
