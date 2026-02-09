#!/usr/bin/env python3
"""Log events."""

import logging
import os


def _logger_config():
    """Configure log format."""
    if os.environ.get("DEBUG"):
        log_format = "%(asctime)s [%(levelname)s] line %(lineno)d %(message)s"
        level = logging.DEBUG
    else:
        log_format = "%(asctime)s [%(levelname)s] %(message)s"
        level = logging.INFO
    return {"level": level, "format": log_format, "filemode": "w"}


def logger(name="tolkein"):
    """
    Create logger.

    Args:
        name (str, optional): Logger name. Defaults to "tolkein".

    Returns:
        logging.Logger: A logger instance.
    """
    config = _logger_config()
    logging.basicConfig(**config)
    _logger = logging.getLogger(name)
    _logger.propagate = False
    # _logger.handlers = []
    _logger.setLevel(config["level"])
    stream_h = logging.StreamHandler()
    formatter = logging.Formatter(config["format"])
    stream_h.setFormatter(formatter)
    _logger.addHandler(stream_h)
    for handler in _logger.handlers:
        handler.formatter.default_msec_format = "%s.%03d"
    return _logger


class DisableLogger:
    """
    Logger context management.

    .. testsetup::

       from tolkein.lib.tolog import logger
       from tolkein.lib.tolog import DisableLogger
       my_logger = logger(__name__)

    .. doctest::

        >>> my_logger.info('Print log messages')
        >>> with DisableLogger():
        ...     my_logger.info('Disable log messages')
        >>> my_logger.info('Print log messages again')

    """

    def __enter__(self):
        """Set logging level to critical."""
        logging.disable(logging.CRITICAL)

    def __exit__(self, x, y, z):
        """Set logging level back to default."""
        logging.disable(logging.NOTSET)


if __name__ == "__main__":
    import doctest

    doctest.testmod()
