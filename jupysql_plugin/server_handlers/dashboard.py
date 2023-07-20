import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from jupyter_server.services.contents import filemanager
from ploomber_core.telemetry.telemetry import UserSettings
import tornado
import requests
import os

BACKEND_ENDPOINT = "https://cloudapi.ploomber.io"


class RouteHandler(APIHandler):
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
        user_key = input_data["api_key"]

        # Valid API Key by /users/me API
        VALIDATION_API_URL = f"{BACKEND_ENDPOINT}/users/me/"
        headers = {"access_token": user_key}
        res = requests.get(VALIDATION_API_URL, headers=headers)
        if res.status_code == 200:
            settings = UserSettings()
            settings.cloud_key = user_key
            self.finish({"result": "success"})
        else:
            self.finish({"result": "fail", "detail": res.json()})


class JobHandler(APIHandler):
    """
    Endpoint: /dashboard/job
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
        API_URL = f"{BACKEND_ENDPOINT}/jobs/webapp/"
        root_dir = filemanager.FileContentsManager().root_dir

        input_data = self.get_json_body()
        access_token = input_data["api_key"]
        project_id = input_data["project_id"]
        notebook_path_relative = input_data["notebook_path"]

        # New project deployment: {domain}/jobs/webapp/new
        if project_id:
            API_URL = API_URL + project_id
        else:
            # Existing project deployment: {domain}/jobs/webapp/{project_id}
            API_URL = API_URL + "new"

        # Get the requirement file paths
        # 1. notebook_path: from request
        # 2. requirement_txt_path: located as same folder as notebook file
        notebook_path = os.path.join(root_dir, notebook_path_relative)
        requirements_txt_path = os.path.join(
            os.path.dirname(notebook_path), "requirements.txt"
        )

        # Fetch requried files
        upload_files = []
        self.file_upload(upload_files, requirements_txt_path)
        self.file_upload(upload_files, notebook_path)

        headers = {"access_token": access_token}
        res = requests.post(API_URL, headers=headers, files=upload_files)

        # Forward request result
        self.finish(json.dumps({"deployment_result": res.json()}))

    def file_upload(self, upload_files, file_path):
        try:
            upload_files.append(("files", open(file_path, "rb")))
        except FileNotFoundError:
            self.finish(
                {"deployment_result": {"detail": file_path, "type": "missing file"}}
            )
            raise FileNotFoundError


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    # Endpoint: /dashboard/apikey
    route_pattern = url_path_join(base_url, "dashboard", "apikey")
    apikey_handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, apikey_handlers)
    # Endpoint: /dashboard/job
    route_pattern = url_path_join(base_url, "dashboard", "job")
    job_handlers = [(route_pattern, JobHandler)]
    web_app.add_handlers(host_pattern, job_handlers)
