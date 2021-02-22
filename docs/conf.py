# -*- coding: utf-8 -*-
# pylint: disable=all
"""genomehubs documentation config."""

import os
import traceback

extensions = [
    "sphinx.ext.autodoc",
    "sphinx.ext.autosummary",
    "sphinx.ext.coverage",
    "sphinx.ext.doctest",
    "sphinx.ext.extlinks",
    "sphinx.ext.ifconfig",
    "sphinx.ext.napoleon",
    "sphinx.ext.todo",
    "sphinx.ext.viewcode",
]
source_suffix = ".rst"
master_doc = "index"
project = "genomehubs"
year = "2020"
author = "genomehubs"
author_email = "genomehubs@genomehubs.org"
copyright = "{0}, {1}".format(year, author)
try:
    from pkg_resources import get_distribution

    version = release = get_distribution("genomehubs").version
except Exception:
    traceback.print_exc()
    version = release = "2.0.0"

pygments_style = "trac"
templates_path = ["."]
extlinks = {
    "issue": ("https://github.com/genomehubs/genomehubs/issues/%s", "#"),
    "pr": ("https://github.com/genomehubs/genomehubs/pull/%s", "PR #"),
}
# on_rtd is whether we are on readthedocs.org
on_rtd = os.environ.get("READTHEDOCS", None) == "True"

if not on_rtd:  # only set the theme if we're building docs locally
    html_theme = "sphinx_rtd_theme"

html_use_smartypants = True
html_last_updated_fmt = "%b %d, %Y"
html_split_index = False
html_sidebars = {
    "**": ["searchbox.html", "globaltoc.html", "sourcelink.html"],
}
html_short_title = "%s-%s" % (project, version)

napoleon_use_ivar = True
napoleon_use_rtype = False
napoleon_use_param = False
