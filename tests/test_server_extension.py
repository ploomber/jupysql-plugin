from unittest.mock import Mock
import json
from pathlib import Path

from ploomber_core.telemetry import telemetry

from jupysql_plugin.server_handlers import dashboard


async def test_get_api_key_empty(tmp_empty, monkeypatch, jp_fetch):
    monkeypatch.setattr(telemetry, "DEFAULT_HOME_DIR", "dir")

    response = await jp_fetch("dashboard", "apikey", method="GET")

    assert response.body == b'{"data": null}'
    assert response.code == 200


async def test_get_api_key(tmp_empty, monkeypatch, jp_fetch):
    monkeypatch.setattr(telemetry, "DEFAULT_HOME_DIR", "dir")

    dir = Path("dir", "stats")
    dir.mkdir(parents=True)
    (dir / "config.yaml").write_text("cloud_key: mykey")

    response = await jp_fetch("dashboard", "apikey", method="GET")

    assert response.body == b'{"data": "mykey"}'
    assert response.code == 200


async def test_set_api_key(tmp_empty, monkeypatch, jp_fetch):
    mock_get = Mock()
    mock_get.return_value.status_code = 200
    monkeypatch.setattr(dashboard.requests, "get", mock_get)
    monkeypatch.setattr(telemetry, "DEFAULT_HOME_DIR", "dir")

    dir = Path("dir", "stats")
    dir.mkdir(parents=True)
    (dir / "config.yaml").write_text("cloud_key: mykey")

    response = await jp_fetch(
        "dashboard",
        "apikey",
        method="POST",
        body=json.dumps({"api_key": "mykey"}),
    )

    assert response.body == b'{"result": "success"}'
    assert response.code == 200

    # TODO: check mock_get was called with the right url


# TODO: test invalid api key
# TODO: test invalid request when trying to store api key
# TODO: error when missing notebook file


async def test_notebook_deploy(tmp_empty, monkeypatch, jp_fetch):
    mock_post = Mock()
    mock_post.return_value.status_code = 200
    mock_post.return_value.json.return_value = {"key": "value"}
    monkeypatch.setattr(dashboard.requests, "post", mock_post)

    Path("nb.ipynb").touch()
    Path("requirements.txt").touch()

    response = await jp_fetch(
        "dashboard",
        "job",
        method="POST",
        body=json.dumps(
            {
                "api_key": "mykey",
                "notebook_path": "nb.ipynb",
                "project_id": "myproject",
            }
        ),
    )

    assert json.loads(response.body) == {"deployment_result": {"key": "value"}}
    assert response.code == 200

    # TODO: check mock_post was called with the right url
