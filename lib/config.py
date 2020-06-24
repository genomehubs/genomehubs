#!/usr/bin/env python3

"""Load configuration from file(s)."""

import os
import collections.abc

from file_io import load_yaml


def update(original, latest):
    """Update nested dict."""
    # https://stackoverflow.com/a/3233356
    for k, v in latest.items():
        if isinstance(v, collections.abc.Mapping):
            original[k] = update(original.get(k, {}), v)
        else:
            original[k] = v
    return original


def load_config(options, file):  # pylint: disable=too-many-branches
    """Load configuration from file."""
    new_options = load_yaml(file)
    if 'common' in new_options:  # pylint: disable=too-many-nested-blocks
        for k in new_options.keys():
            for key, value in new_options['common'].items():
                if key not in new_options[k]:
                    new_options[k][key] = value
                elif isinstance(new_options[k][key], dict):
                    for sub_key, sub_value in new_options['common'][key].items():
                        if sub_key not in new_options[k][key]:
                            new_options[k][key][sub_key] = sub_value
    for k in new_options.keys():
        if k not in options:
            options[k] = {}
        for key, value in new_options[k].items():
            if isinstance(new_options[k][key], dict):
                for sub_key, sub_value in new_options[k][key].items():
                    if isinstance(sub_value, str) and sub_value.startswith('~'):
                        sub_value = os.path.expanduser(sub_value)
                    if key == 'taxonomy' and sub_key == 'root' and not isinstance(sub_value, list):
                        sub_value = [int(sub_value)]
                    options[k]["%s-%s" % (key, sub_key)] = sub_value
            else:
                if isinstance(value, str) and value.startswith('~'):
                    value = os.path.expanduser(value)
                options[k][key] = value
    return options


def config(group, **kwargs):  # pylint: disable=too-many-branches
    """Load configuration."""
    script_dir = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    dist_file = os.path.join(script_dir, 'config', 'dist.config.yaml')
    user_file = os.path.join(script_dir, 'config', 'config.yaml')
    options = {}
    if os.path.exists(dist_file):
        options = load_config(options, dist_file)
    if os.path.exists(user_file):
        options = load_config(options, user_file)
    for file in kwargs['--configfile']:
        if os.path.exists(file):
            options = load_config(options, file)
    if group not in options:
        options[group] = {}
    for k, v in kwargs.items():
        if v:
            k = k.lstrip('--')
            if isinstance(v, str):
                if v.startswith('~'):
                    v = os.path.expanduser(v)
            if k in options[group]:
                options[group][k] = v
            elif not k == group:
                options[group][k] = v
    return options
