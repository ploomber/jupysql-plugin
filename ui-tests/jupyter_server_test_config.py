"""Server configuration for integration tests.

!! Never use this configuration in production because it
opens the server to the world and provide access to JupyterLab
JavaScript objects through the global window variable.
"""
from tempfile import mkdtemp

c.ServerApp.port = 8888  # noqa: F821
c.ServerApp.port_retries = 0  # noqa: F821
c.ServerApp.open_browser = False  # noqa: F821

c.ServerApp.root_dir = mkdtemp(prefix='galata-test-')  # noqa: F821
c.ServerApp.token = ""  # noqa: F821
c.ServerApp.password = ""  # noqa: F821
c.ServerApp.disable_check_xsrf = True  # noqa: F821
c.LabApp.expose_app_in_browser = True  # noqa: F821

# Uncomment to set server log level to debug level
# c.ServerApp.log_level = "DEBUG"
