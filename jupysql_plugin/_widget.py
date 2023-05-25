from ipywidgets import DOMWidget
from traitlets import Unicode


module_name = "jupysql-plugin"
module_version = "0.1.3"


class ExampleWidget(DOMWidget):
    """TODO: Add docstring here"""

    _model_name = Unicode("ExampleModel").tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode("ExampleView").tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    value = Unicode("Hello World").tag(sync=True)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.on_msg(self._handle_message)

    def _handle_message(self, widget, content, buffers):
        if "method" in content:
            method = content["method"]
            if method == "submit_form":
                form_data = content["data"]
                self._process_form_data(form_data)

    def _process_form_data(self, form_data):
        # Process the form data received from the frontend
        dropdown_value = form_data.get("dropdown")
        port_value = form_data.get("port")

        # Perform desired actions with the form data
        try:
            # Run your function here and check for any errors
            # If no errors, send success message to the frontend
            if dropdown_value == "A" or port_value == 10:
                raise ValueError("some stuff went bad")
        except Exception:
            # If there are errors, send error message to the frontend
            self.send_confirmation_message("Error")
        else:
            self.send_confirmation_message("Success!")

    def send_confirmation_message(self, message):
        self.send({"method": "display_confirmation_message", "message": message})


# this widget needs
# jlpm add bootstrap
# jlpm add --dev @types/bootstrap
class StockTableWidget(DOMWidget):
    _model_name = Unicode("StockTableModel").tag(sync=True)
    _model_module = Unicode(module_name).tag(sync=True)
    _model_module_version = Unicode(module_version).tag(sync=True)
    _view_name = Unicode("StockTableView").tag(sync=True)
    _view_module = Unicode(module_name).tag(sync=True)
    _view_module_version = Unicode(module_version).tag(sync=True)

    def __init__(self, stock_data=None, **kwargs):
        if stock_data is not None:
            self.stock_data = stock_data
        super().__init__(**kwargs)
