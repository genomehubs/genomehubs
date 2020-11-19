#!/usr/bin/env python3

"""Load configuration from file(s)."""

import os

from tolkein import tofile
from tolkein import tolog

LOGGER = tolog.logger(__name__)


def set_common_values(group_options, common_options):
    """Set common options across all option groups."""
    for key, value in common_options.items():
        if key not in group_options:
            group_options[key] = value
        elif isinstance(group_options[key], dict):
            for sub_key, sub_value in common_options[key].items():
                if sub_key not in group_options[key]:
                    group_options[key][sub_key] = sub_value


def update_subsets(flattened_group_options, group_options):
    """Update nested config options."""
    for key, value in group_options.items():
        if isinstance(group_options[key], dict):
            for sub_key, sub_value in group_options[key].items():
                if isinstance(group_options[key][sub_key], dict):
                    for sub_sub_key, sub_sub_value in group_options[key][
                        sub_key
                    ].items():
                        if isinstance(sub_sub_value, str) and sub_sub_value.startswith(
                            "~"
                        ):
                            sub_sub_value = os.path.expanduser(sub_sub_value)
                        elif (
                            not isinstance(sub_sub_value, list)
                            and sub_sub_key == "root"
                        ):
                            sub_sub_value = [sub_sub_value]
                        flattened_group_options[
                            "%s-%s-%s" % (key, sub_key, sub_sub_key)
                        ] = sub_sub_value
                else:
                    if isinstance(sub_value, str) and sub_value.startswith("~"):
                        sub_value = os.path.expanduser(sub_value)
                    flattened_group_options["%s-%s" % (key, sub_key)] = sub_value
        else:
            if isinstance(value, str) and value.startswith("~"):
                value = os.path.expanduser(value)
            flattened_group_options[key] = value


def load_config(options, file):
    """Load configuration from file."""
    new_options = tofile.load_yaml(file)
    if "common" in new_options:
        for group_name, group_options in new_options.items():
            if group_name != "common":
                set_common_values(group_options, new_options["common"])
    for group_name, group_options in new_options.items():
        if group_name not in options:
            options[group_name] = {}
        nested_group_options = options[group_name]
        update_subsets(nested_group_options, group_options)
    return options


def enforce_lists(options):
    """Ensure specified options are lists."""
    keys = {"es-host"}
    for key in keys:
        if key in options:
            if not isinstance(options[key], list):
                options[key] = [options[key]]


def config(group, **kwargs):
    """Load configuration."""
    LOGGER.info("Loading configuration options")
    script_dir = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
    dist_file = os.path.join(script_dir, "config", "dist.config.yaml")
    user_file = os.path.join(script_dir, "config", "config.yaml")
    options = {}
    if os.path.exists(dist_file):
        options = load_config(options, dist_file)
    else:
        print(dist_file)
    if os.path.exists(user_file):
        options = load_config(options, user_file)
    if "--config-file" in kwargs:
        for file in kwargs["--config-file"]:
            if os.path.exists(file):
                options = load_config(options, file)
    if group not in options:
        options[group] = {}
    for k, v in kwargs.items():
        if v:
            k = k.lstrip("--")
            if isinstance(v, str):
                if v.startswith("~"):
                    v = os.path.expanduser(v)
            if k in options[group]:
                options[group][k] = v
            elif not k == group:
                options[group][k] = v
    enforce_lists(options)
    return options
