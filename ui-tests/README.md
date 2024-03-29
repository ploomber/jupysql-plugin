# Integration Testing

This folder contains the integration tests of the extension.

They are defined using [Playwright](https://playwright.dev/docs/intro) test runner
and [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) helper.

The Playwright configuration is defined in [playwright.config.js](./playwright.config.js).

The JupyterLab server configuration to use for the integration test is defined
in [jupyter_server_test_config.py](./jupyter_server_test_config.py).

The default configuration will produce video for failing tests and an HTML report.

## Run the tests

> All commands are assumed to be executed from the root directory

To run the tests, you need to:

1. Compile the extension:

```sh
# disable the floating cell toolbar since our tests assume it's hidden
jupyter labextension disable @jupyterlab/cell-toolbar-extension

jlpm install
jlpm build:prod
```

> Check the extension is installed in JupyterLab.

2. Install test dependencies (needed only once):

```sh
cd ./ui-tests
jlpm install
jlpm playwright install
cd ..
```

3. Execute the [Playwright](https://playwright.dev/docs/intro) tests:

```sh
cd ./ui-tests
jlpm test

# to add a timeout (in ms) and execute specific tests
jlpm playwright test --timeout 5000 --grep 'somename'
```

Test results will be shown in the terminal. In case of any test failures, the test report
will be opened in your browser at the end of the tests execution; see
[Playwright documentation](https://playwright.dev/docs/test-reporters#html-reporter)
for configuring that behavior.

### Noes for writing UI tests

- If the UI tests fail, check the recording. If the video shows that no notebook is opened, it might be that the tests are trying to open a notebook that doesn't exist, this might happen with notebooks in hidden folders
- If a cell doesn't produce an output and a screenshot is taken, an error is raised


## Update the tests snapshots

> All commands are assumed to be executed from the root directory

If you are comparing snapshots to validate your tests, you may need to update
the reference snapshots stored in the repository. To do that, you need to:

1. Compile the extension:

```sh
jlpm install
jlpm build:prod
```

> Check the extension is installed in JupyterLab.

2. Install test dependencies (needed only once):

```sh
cd ./ui-tests
jlpm install
jlpm playwright install
cd ..
```

3. Execute the [Playwright](https://playwright.dev/docs/intro) command:

```sh
cd ./ui-tests
jlpm playwright test --update-snapshots
```

> Some discrepancy may occurs between the snapshots generated on your computer and
> the one generated on the CI. To ease updating the snapshots on a PR, you can
> type `please update playwright snapshots` to trigger the update by a bot on the CI.
> Once the bot has computed new snapshots, it will commit them to the PR branch.

## Create tests

> All commands are assumed to be executed from the root directory

To create tests, the easiest way is to use the code generator tool of playwright:

1. Compile the extension:

```sh
jlpm install
jlpm build:prod
```

> Check the extension is installed in JupyterLab.

2. Install test dependencies (needed only once):

```sh
cd ./ui-tests
jlpm install
jlpm playwright install
cd ..
```

3. Execute the [Playwright code generator](https://playwright.dev/docs/codegen):

```sh
# NOTE: if you don't have JupyterLab running, start it
cd ./ui-tests
jlpm start
```

```sh
cd ./ui-tests
jlpm playwright codegen localhost:8888
```

The galata framework exposes several convenient methods to mock user actions, most
of what you need is in the `notebook` object, you can see the [methods here.](https://github.com/jupyterlab/jupyterlab/blob/main/galata/src/helpers/notebook.ts).

To get a sense of how a test looks like, check out [JupyterLab's tests.](https://github.com/jupyterlab/jupyterlab/tree/7a30f77d9c344a9a750e279bd65ac3d420af01d9/galata/test/jupyterlab)

## Debug tests

> All commands are assumed to be executed from the root directory

To debug tests, a good way is to use the inspector tool of playwright:

1. Compile the extension:

```sh
jlpm install
jlpm build:prod
```

> Check the extension is installed in JupyterLab.

2. Install test dependencies (needed only once):

```sh
cd ./ui-tests
jlpm install
jlpm playwright install
cd ..
```

3. Execute the Playwright tests in [debug mode](https://playwright.dev/docs/debug):

```sh
cd ./ui-tests
PWDEBUG=1 jlpm playwright test
```
