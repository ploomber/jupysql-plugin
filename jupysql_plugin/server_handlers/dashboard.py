import json
from functools import partial

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from jupyter_server.services.contents import filemanager
from ploomber_core.telemetry.telemetry import UserSettings
import tornado
import requests
import os

PLOOMBER_CLOUD_HOST = os.environ.get(
    "PLOOMBER_CLOUD_HOST", "https://cloud-prod.ploomber.io"
)


class FileUploadMixin:
    def file_upload(self, upload_files, file_path):
        try:
            upload_files.append(("files", open(file_path, "rb")))
        except FileNotFoundError:
            self.finish(
                {"deployment_result": {"detail": file_path, "type": "missing file"}}
            )
            raise FileNotFoundError


class APIKeyHandler(APIHandler):
    """
    Endpoint: /dashboard/apikey, setter/getter for the API Key through ploomber_core
    The File is located in: ~/.ploomber/stats/config.yaml
    """

    @tornado.web.authenticated
    def get(self):
        """Return cloud_key as API Key"""
        key = UserSettings().cloud_key
        self.finish(json.dumps({"data": key}))

    @tornado.web.authenticated
    def post(self):
        input_data = self.get_json_body()
        api_key = input_data["api_key"]

        # Valid API Key by /users/me API
        VALIDATION_API_URL = f"{PLOOMBER_CLOUD_HOST}/users/me/"
        headers = {"api_key": api_key}
        res = requests.get(VALIDATION_API_URL, headers=headers)

        if res.status_code == 200:
            settings = UserSettings()
            settings.cloud_key = api_key
            self.finish({"result": "success"})
        else:
            self.finish({"result": "fail", "detail": res.json()})


class NotebookAppHandler(FileUploadMixin, APIHandler):
    """
    Endpoint: /jobs/webservice
    We need the access the file system through this endpoint, we need below files:
    1. notebook file
    2. requirements.txt
    """

    @tornado.web.authenticated
    def post(self):
        """
        post data:
        1. api_key
        2. project_id (optional)
        3. notebook file path
        """
        API_URL = f"{PLOOMBER_CLOUD_HOST}/jobs/webservice"
        root_dir = filemanager.FileContentsManager().root_dir

        input_data = self.get_json_body()
        api_key = input_data["api_key"]
        project_id = input_data["project_id"]
        notebook_path_relative = input_data["notebook_path"]

        if project_id:
            make_request = partial(
                requests.post, f"{API_URL}/voila?project_id={project_id}"
            )
        else:
            make_request = partial(requests.post, f"{API_URL}/voila")

        # Get the requirement file paths
        # 1. notebook_path: from request
        # 2. requirement_txt_path: located as same folder as notebook file
        notebook_path = os.path.join(root_dir, notebook_path_relative)
        requirements_txt_path = os.path.join(
            os.path.dirname(notebook_path), "requirements.txt"
        )

        # Fetch required files
        upload_files = []
        self.file_upload(upload_files, requirements_txt_path)
        self.file_upload(upload_files, notebook_path)

        headers = {"api_key": api_key}
        res = make_request(headers=headers, files=upload_files)

        # Forward request result
        self.finish(json.dumps({"deployment_result": res.json()}))


class NotebookUploadHandler(FileUploadMixin, APIHandler):
    """Handler to upload a notebook to the cloud (to render it as a static file)"""

    @tornado.web.authenticated
    def post(self):
        API_URL = f"{PLOOMBER_CLOUD_HOST}/notebooks"
        root_dir = filemanager.FileContentsManager().root_dir

        input_data = self.get_json_body()
        api_key = input_data["api_key"]
        notebook_path_relative = input_data["notebook_path"]

        make_request = partial(requests.post, API_URL)

        notebook_path = os.path.join(root_dir, notebook_path_relative)

        upload_files = []
        self.file_upload(upload_files, notebook_path)

        headers = {"api_key": api_key}
        res = make_request(headers=headers, files=upload_files)

        self.finish(json.dumps({"deployment_result": res.json()}))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    # Endpoint: /dashboard/apikey
    route_pattern = url_path_join(base_url, "ploomber", "apikey")
    apikey_handlers = [(route_pattern, APIKeyHandler)]
    web_app.add_handlers(host_pattern, apikey_handlers)

    # Endpoint: /jobs/webservice
    route_pattern = url_path_join(base_url, "ploomber", "job")
    job_handlers = [(route_pattern, NotebookAppHandler)]
    web_app.add_handlers(host_pattern, job_handlers)

    web_app.add_handlers(
        host_pattern,
        [
            (
                url_path_join(base_url, "ploomber", "nb-upload"),
                NotebookUploadHandler,
            )
        ],
    )
