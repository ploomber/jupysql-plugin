"""Server configuration for integration tests.

!! Never use this configuration in production because it
opens the server to the world and provide access to JupyterLab
JavaScript objects through the global window variable.
"""
from pathlib import Path
from tempfile import mkdtemp

from ploomber_core.telemetry import telemetry

temp_dir = mkdtemp(prefix="galata-test-")
dot_ploomber = str(Path(temp_dir, "dot-ploomber"))

c.ServerApp.port = 8888  # noqa: F821
c.ServerApp.port_retries = 0  # noqa: F821
c.ServerApp.open_browser = False  # noqa: F821

c.ServerApp.root_dir = temp_dir  # noqa: F821
c.ServerApp.token = ""  # noqa: F821
c.ServerApp.password = ""  # noqa: F821
c.ServerApp.disable_check_xsrf = True  # noqa: F821
c.LabApp.expose_app_in_browser = True  # noqa: F821

# Uncomment to set server log level to debug level
# c.ServerApp.log_level = "DEBUG"


# patch the ploomber configurationd directory so it doesn't
# interfere with the user's configuration
telemetry.DEFAULT_HOME_DIR = dot_ploomber
