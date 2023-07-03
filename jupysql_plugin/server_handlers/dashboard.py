import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
from jupyter_server.services.contents import filemanager

from ploomber_core.telemetry.telemetry import UserSettings
import tornado
import requests
import os

class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        key = UserSettings().cloud_key
        self.finish(json.dumps({"data": key}))

    @tornado.web.authenticated
    def post(self):
        # input_data is a dictionary with a key "name"
        input_data = self.get_json_body()
        # data = {"greetings": "Hello {}, enjoy JupyterLab!".format(input_data["name"])}
        # self.finish(json.dumps(data))
        user_key = input_data['api_key']
        settings = UserSettings()
        settings.cloud_key = user_key
        # click.secho("Key was stored")

class JobHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def post(self):

        URL = "https://cloudapi.ploomber.io/jobs/webapp/"
        root_dir = filemanager.FileContentsManager().root_dir

        input_data = self.get_json_body()
        access_token = input_data['api_key']
        project_id = input_data['project_id']

        if project_id:
            URL = URL + project_id
            print ("Update Deploy")
        else:
            URL = URL + "new"
            print ("New Deploy")
            
        notebook_path = os.path.join(root_dir, input_data['notebook_path'])
        # Assumption: requirement.txt is 
        requirement_txt_path = os.path.join(os.path.dirname(notebook_path), 'requirements.txt')

        # Valid the notebook and requirement path exist
        files = [('files', open(notebook_path, 'rb')), ('files', open(requirement_txt_path, 'rb'))]
    
        headers = {"access_token": access_token}

        res = requests.post(URL, headers=headers, files=files)

        self.finish(json.dumps({"deployment_result" : res.json()}))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    # Prepend the base_url so that it works in a JupyterHub setting
    route_pattern = url_path_join(base_url, "dashboard", "apikey")
    apikey_handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, apikey_handlers)

    route_pattern = url_path_join(base_url, "dashboard", "job")
    job_handlers = [(route_pattern, JobHandler)]
    web_app.add_handlers(host_pattern, job_handlers)
