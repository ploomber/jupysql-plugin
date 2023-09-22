# jupysql-plugin
## Install

```bash
pip install jupysql-plugin
```

## Contributing

### Development install

```sh
conda create --name jupysql-plugin python=3.11 --channel conda-forge --yes
conda activate jupysql-plugin
conda install nodejs --channel conda-forge --yes
pip install -r requirements.txt
pip install -r requirements.dev.txt

jlpm install
```
Note: `pkgmt format` can be used to format and lint before committing code. 

```bash
# Note: this command will take some time the first time as it has to install
# and compile the frontend code
pip install -e "."

jupyter labextension develop . --overwrite
jupyter server extension enable jupysql_plugin

# NOTE: the two previous commands will fail if there are missing dependencies

# rebuild extension Typescript
# important: we had to set skipLibCheck: true
# https://discourse.jupyter.org/t/struggling-with-extensions-and-dependencies-versions/19550
jlpm build
```

To watch for changes and reload:

```bash
# in one terminal
jlpm watch

# another terminal
jupyter lab
```

Refresh JupyterLab to load the change in your browser.

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### adding dependencies

```bash
jlpm add PACKAGE

# example
jlpm add @jupyter-widgets/base
```

### Development uninstall

```bash
pip uninstall jupysql-plugin
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupysql-plugin` within that folder.

### Testing the extension

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

This extension uses [Playwright](https://playwright.dev/docs/intro/) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab. More information are provided within the [ui-tests](./ui-tests/README.md) README.

To run the tests:

```sh
pip install nox pyyaml

# note that this will also create a venv
nox --session test

# to only run the python unit tests
pytest tests
```

### Releasing the extension

See [RELEASE](RELEASE.md)

### Configuration

The `package.json` file contains a `jupyterlab` extension. More information about
this section is [here](https://github.com/jupyterlab/jupyterlab/blob/main/docs/source/extension/extension_dev.rst) (you might need to switch the git branch dependin on which version JupyterLab version you're building for). The schema is [here](https://github.com/jupyterlab/jupyterlab/blob/main/builder/metadata_schema.json).

### Ploomber Cloud API Endpoint

You can set the `PLOOMBER_CLOUD_HOST` variable to switch the API endpoint (by default, it's set to our production API endpoint).

```sh
export PLOOMBER_CLOUD_HOST=https://cloudapi-dev.ploomber.io
```