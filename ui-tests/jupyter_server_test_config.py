"""Server configuration for integration tests.

!! Never use this configuration in production because it
opens the server to the world and provide access to JupyterLab
JavaScript objects through the global window variable.
"""

from jupyterlab.galata import configure_jupyter_server
from pathlib import Path

from ploomber_core.telemetry import telemetry

configure_jupyter_server(c)  # noqa: F821

dot_ploomber = str(Path(c.ServerApp.root_dir, "dot-ploomber"))  # noqa: F821

# Uncomment to set server log level to debug level
# c.ServerApp.log_level = "DEBUG"


# patch the ploomber configurationd directory so it doesn't
# interfere with the user's configuration
telemetry.DEFAULT_HOME_DIR = dot_ploomber
