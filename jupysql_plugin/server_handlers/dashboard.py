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
        VALIDATION_API_URL = f"{PLOOMBER_CLOUD_HOST}/users/me/"
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
        access_token = input_data["api_key"]
        project_id = input_data["project_id"]
        notebook_path_relative = input_data["notebook_path"]

        if project_id:
            make_request = partial(requests.put, f"{API_URL}/{project_id}")

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

        headers = {"access_token": access_token}
        res = make_request(headers=headers, files=upload_files)

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


class ProjectsHandler(APIHandler):
    """
    Endpoint: /projects
    """

    @tornado.web.authenticated
    def post(self):
        """Return project details"""

        input_data = self.get_json_body()
        project_id = input_data["project_id"]
        access_token = input_data["api_key"]
        API_URL = f"{PLOOMBER_CLOUD_HOST}/projects"
        make_request = partial(requests.get, f"{API_URL}/{project_id}")

        headers = {"access_token": access_token}
        res = make_request(headers=headers)
        self.finish(json.dumps({"project_details": res.json()}))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    # Endpoint: /dashboard/apikey
    route_pattern = url_path_join(base_url, "dashboard", "apikey")
    apikey_handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, apikey_handlers)
    # Endpoint: /jobs/webservice
    route_pattern = url_path_join(base_url, "dashboard", "job")
    job_handlers = [(route_pattern, JobHandler)]
    web_app.add_handlers(host_pattern, job_handlers)
    # Endpoint: /projects
    route_pattern = url_path_join(base_url, "dashboard", "projects")
    project_handlers = [(route_pattern, ProjectsHandler)]
    web_app.add_handlers(host_pattern, project_handlers)
