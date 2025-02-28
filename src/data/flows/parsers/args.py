#!/usr/bin/env python3

import argparse

if __name__ == "__main__" and __package__ is None:
    sys.path.insert(0, dirname(dirname(dirname(abspath(__file__)))))
    __package__ = "flows"

from flows.lib.shared_args import APPEND, INPUT_PATH, YAML_PATH


def parse_args(description: str = "An input file parser") -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description=description)
    command_line_args = [INPUT_PATH, YAML_PATH, APPEND]
    for arg in command_line_args:
        parser.add_argument(*arg["flags"], **arg["keys"])

    return parser.parse_args()
