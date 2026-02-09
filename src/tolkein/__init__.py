"""Vendored tolkein shim."""

from genomehubs.vendor.tolkein.lib import tobin  # noqa: F401
from genomehubs.vendor.tolkein.lib import tofetch  # noqa: F401
from genomehubs.vendor.tolkein.lib import tofile  # noqa: F401
from genomehubs.vendor.tolkein.lib import toinsdc  # noqa: F401
from genomehubs.vendor.tolkein.lib import tolog  # noqa: F401
from genomehubs.vendor.tolkein.lib import totax  # noqa: F401
from genomehubs.vendor.tolkein.lib import version  # noqa: F401
from genomehubs.vendor.tolkein.tolkein import cli  # noqa: F401

__all__ = [
    "cli",
    "tobin",
    "tofetch",
    "tofile",
    "toinsdc",
    "tolog",
    "totax",
    "version",
]
