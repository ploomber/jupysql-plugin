## Learning the basics of developing JupyterLab extensions

Follow the official [tutorial.](https://jupyterlab.readthedocs.io/en/stable/extension/extension_tutorial.html)

Some notes from following the tutorial (April 4th, 2023):

- Install the extension with `jupyter labextension develop --overwrite .`, because using `pip install` won't update the extension
- When installing the widgets library, run `jlpm add @lumino/widgets@'<2.0.0'`
