#!/usr/bin/env python3

"""Log GenomeHubs events."""

import logging


def logger_config(debug=False):
    """Log Elasticsearch events."""
    if debug:
        log_format = '%(asctime)s [%(levelname)s] line %(lineno)d %(message)s'
        level = logging.DEBUG
    else:
        log_format = '%(asctime)s [%(levelname)s] %(message)s'
        level = logging.INFO
    return {
        'level': level,
        'format': log_format,
        'filemode': 'w'
    }


def logger():
    """Log GenomeHubs events."""
    logging.basicConfig(**logger_config())
    for handler in logging.getLogger().handlers:
        handler.formatter.default_msec_format = '%s.%03d'
    return logging.getLogger()
