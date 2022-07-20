"""
A setuptools based setup module.

See:
https://packaging.python.org/guides/distributing-packages-using-setuptools/
https://github.com/pypa/sampleproject
"""

import io
import re
from os.path import dirname
from os.path import join

from setuptools import find_packages
from setuptools import setup


def read(*names, **kwargs):
    """Read file."""
    with io.open(
        join(dirname(__file__), *names), encoding=kwargs.get("encoding", "utf8")
    ) as fh:
        return fh.read()


setup(
    name="genomehubs",  # Required
    version="2.5.6",
    description="GenomeHubs",  # Optional
    long_description="%s\n%s"
    % (
        re.compile("^.. start-badges.*^.. end-badges", re.M | re.S).sub(
            "", read("README.rst")
        ),
        re.sub(":[a-z]+:`~?(.*?)`", r"``\1``", read("CHANGELOG.rst")),
    ),
    long_description_content_type="text/x-rst",  # Optional (see note above)
    url="https://github.com/genomehubs/genomehubs",  # Optional
    # This should be your name or the name of the organization which owns the
    # project.
    author="genomehubs",  # Optional
    # This should be a valid email address corresponding to the author listed
    # above.
    author_email="genomehubs@genomehubs.org",  # Optional
    # Classifiers help users find your project by categorizing it.
    #
    # For a list of valid classifiers, see https://pypi.org/classifiers/
    classifiers=[  # Optional
        # How mature is this project? Common values are
        #   3 - Alpha
        #   4 - Beta
        #   5 - Production/Stable
        "Development Status :: 3 - Alpha",
        # Indicate who your project is intended for
        "Intended Audience :: Science/Research",
        "Topic :: Scientific/Engineering :: Bio-Informatics",
        # Pick your license as you wish
        "License :: OSI Approved :: MIT License",
        # Specify the Python versions you support here. In particular, ensure
        # that you indicate you support Python 3. These classifiers are *not*
        # checked by 'pip install'. See instead 'python_requires' below.
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.6",
        "Programming Language :: Python :: 3.7",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3 :: Only",
    ],
    # This field adds keywords for your project which will appear on the
    # project page. What does your project relate to?
    #
    # Note that this is a list of additional keywords, separated
    # by commas, to be used to assist searching for the distribution in a
    # larger catalog.
    keywords="bioinformatics",  # Optional
    # When your source code is in a subdirectory under the project root, e.g.
    # `src/`, it is necessary to specify the `package_dir` argument.
    package_dir={"": "src"},  # Optional
    # You can just specify package directories manually here if your project is
    # simple. Or you can use find_packages().
    #
    # Alternatively, if you just want to distribute a single Python file, use
    # the `py_modules` argument instead as follows, which will expect a file
    # called `my_module.py` to exist:
    #
    #   py_modules=["my_module"],
    #
    packages=find_packages(where="src"),  # Required
    # Specify which Python versions you support. In contrast to the
    # 'Programming Language' classifiers above, 'pip install' will check this
    # and refuse to install the project if the version does not match. See
    # https://packaging.python.org/guides/distributing-packages-using-setuptools/#python-requires
    python_requires=">=3.6, <4",
    # This field lists other packages that your project depends on to run.
    # Any package you put here will be installed by pip when your project is
    # installed, so they must be valid existing projects.
    #
    # For an analysis of "install_requires" vs pip's requirements files see:
    # https://packaging.python.org/en/latest/requirements.html
    install_requires=[
        "biopython>=1.78",
        "docopt>=0.6.2",
        "elasticsearch>=7.8.1,<7.14.0",
        "fastjsonschema>=2.15.3",
        "filetype>=1.0.7",
        "h3>=3.7.4",
        "Pillow>=8.0",
        "pyyaml",
        "sparqlwrapper>=1.4.1",
        "tolkein>=0.5.0",
        "ujson>=3.0.0",
    ],  # Optional
    # List additional groups of dependencies here (e.g. development
    # dependencies). Users will be able to install these using the "extras"
    # syntax, for example:
    #
    #   $ pip install sampleproject[dev]
    #
    # Similar to `install_requires` above, these must be valid existing
    # projects.
    extras_require={  # Optional
        "dev": ["pycodestyle>=2.6.0", "pydocstyle>=5.0.2", "pylint>=2.5.3"],
        "test": [
            "coverage>=5.1",
            "coveralls>=2.0.0",
            "mock>=4.0.2",
            "pytest-cov>=2.10.0",
            "pytest-isort>=1.1.0",
            "pytest-mock>=3.1.1",
            "pytest>=6.0.0",
        ],
    },
    entry_points={
        "console_scripts": ["genomehubs = genomehubs:cli"],
        "genomehubs.subcmd": [
            "fill = genomehubs.lib.fill:cli",
            "index = genomehubs.lib.index:cli",
            "init = genomehubs.lib.init:cli",
            "parse = genomehubs.lib.parse:cli",
            "run = genomehubs.lib.run:cli",
            "test = genomehubs.lib.test:cli",
        ],
    },
    project_urls={
        "Bug Reports": "https://github.com/genomehubs/genomehubs/issues",
        "Source": "https://github.com/genomehubs/genomehubs",
    },
    package_data={"genomehubs": ["genomehubs/config/dist.config.yaml"]},
    include_package_data=True,
)
