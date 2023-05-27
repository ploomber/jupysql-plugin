# Learning JupyterLab extensions + widgets

`jupysql-plugin` is both a JupyterLab extension and a package with custom widgets.

## Jupyter extensions


To familiarize yourself with how JupyterLab extensions are built. Follow the official [tutorial.](https://jupyterlab.readthedocs.io/en/stable/extension/extension_tutorial.html)

There is also a repository with [examples](https://github.com/jupyterlab/extension-examples). **Important:** ensure you move to the 3.0 branch because JupyterLab 4.0 was just release it. Make it work with 3.0, and then we can decide if we also support 4.0.

Some notes from following the tutorial (April 4th, 2023):

- Install the extension with `jupyter labextension develop --overwrite .`, because using `pip install` won't update the extension
- When installing the widgets library, run `jlpm add @lumino/widgets@'<2.0.0'`

## Jupyter widgets

Here's an exaplanation of how [widgets work](https://ipywidgets.readthedocs.io/en/stable/examples/Widget%20Low%20Level.html), and here's a [template](https://github.com/jupyter-widgets/widget-ts-cookiecutter) you can use to experiment with.
