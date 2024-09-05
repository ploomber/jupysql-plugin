# CHANGELOG

## 0.4.5

* Removes bootstrap since it was breaking JupyterLab UI

## 0.4.4

* Fixes error that caused the `Format SQL` bitton to appear even when disabled in the settings

## 0.4.3

* Trigger autocomplete only when the cell begins with `%sql` or `%%sql`

## 0.4.2

* Removed `Share notebook` button

## 0.4.1

* Fix `Share notebook` bug not showing URL (#95)

## 0.4.0

* Support for JupyterLab 4 (for JupyterLab 3, install `pip install jupysql-plugin<0.4`)

## 0.3.1

* Changes API header from `access_token` to `api_key`

## 0.3.0

* Removes `Deploy notebook`
* Adds `Share notebook` button which uploads a notebook to render it as a static file

## 0.2.7

* Fix `Deploy notebook` due to breaking change in API

## 0.2.6

* Fix `Deploy notebook` functionality

## 0.2.5

* Automatically activate server extension

## 0.2.4

* Re-release due to error in the release process

## 0.2.3

* Fixed error that caused the `Deploy notebook` and `Format SQL` buttons not to appear on new installations

## 0.2.2

* Added Oracle, Microsoft SQLServer, Redshift in DB templates (#72)
* Auto save form fields when switching connection labels (#71)
* Add configuration settings to hide `Format SQL` and `Deploy Notebook` buttons
* `ipywidgets` no longer a hard requirement

## 0.2.1

* Connector widget creates parent directories if needed
* Connector widget sets the default alias as "default" if the `.ini` file has no connections
* Connector widget does not modify `.ini` file if the connection fails (#68)
* Connector widget allows editing connections (#61)


## 0.2.0

* Updates "Deploy Notebook" endpoint
* jupysql-plugin now requires `jupysql>=0.10`

## 0.1.9

* Added support for `jupysql>=0.9`

## 0.1.8

* Improved `Deploy notebook` workflow

## 0.1.7

* No changes, fixing build

## 0.1.6

* Adds `Deploy notebook` button

## 0.1.5

* Adds connection helper widget

## 0.1.4

* Comm listeners added for table_widget

## 0.1.3

* Formatting via `Format SQL` button

## 0.1.2

* SQL highlighting for  `%%sql` cells

## 0.1.1

* No changes (testing release process)

## 0.1.0

* Basic SQL code completition