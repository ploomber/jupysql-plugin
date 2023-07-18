# Making a new release of jupysql-plugin

Create conda environment:

```bash
conda env create  -f environment.yml -y
```

Bump the version using `hatch`. See the docs on [hatch-nodejs-version](https://github.com/agoose77/hatch-nodejs-version#semver) for details.

```bash
hatch version <new-version>
```

The previous command will update the version in the `package.json` file. You have to manually commit and create the tag:

```bash
git tag -a VERSION -m MESSAGE
git push --tag
```

To create a Python source package (`.tar.gz`) and the binary package (`.whl`) in the `dist/` directory, do:

*Note:* The following command needs NodeJS:


```bash
# clean files before building
jlpm clean:all

# build the package
python -m build
```

Then to upload the package to PyPI, do:

```bash
twine upload dist/*
```
