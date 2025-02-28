#!/usr/bin/env python3

import importlib.util
import os
from enum import Enum, auto


class Parsers:
    def __init__(self, parsers):
        self.parsers = parsers
        self.ParserEnum = Enum("ParserEnum", {key: auto() for key in parsers.keys()})

    def __getattr__(self, name):
        return self.parsers[name]


def discover_parsers(parsers_dir):
    parsers = {}
    for filename in os.listdir(parsers_dir):
        if filename.startswith("parse_") and filename.endswith(".py"):
            filepath = os.path.join(parsers_dir, filename)
            spec = importlib.util.spec_from_file_location(filename[:-3], filepath)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)
            if hasattr(module, "plugin"):
                print(f"Found plugin function in {filename}")
                plugin = module.plugin()
                parsers[plugin.name] = plugin
    return parsers


def register_plugins():
    """Register all plugins in the parsers directory."""
    # Register all plugins in the parsers directory
    parsers_dir = os.path.dirname(__file__)
    parsers = discover_parsers(parsers_dir)
    return Parsers(parsers)


if __name__ == "__main__":
    register_plugins()
