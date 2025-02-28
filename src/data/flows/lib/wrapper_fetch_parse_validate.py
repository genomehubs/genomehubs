#!/usr/bin/env python3

# sourcery skip: avoid-builtin-shadow
import os
import sys
from argparse import Action, ArgumentParser, Namespace
from enum import Enum
from os.path import abspath, dirname
from typing import Optional

from conditional_import import flow
from fetch_previous_file_pair import fetch_previous_file_pair
from validate_file_pair import validate_file_pair
from shared_args import (
    APPEND,
    DRY_RUN,
    MIN_ASSIGNED,
    MIN_VALID,
    S3_PATH,
    TAXDUMP_PATH,
    WORK_DIR,
    YAML_PATH,
)


if __name__ == "__main__" and __package__ is None:
    sys.path.insert(0, dirname(dirname(dirname(abspath(__file__)))))
    __package__ = "flows"

from flows.parsers.register import register_plugins  # noqa: E402

PARSERS = register_plugins()


class Parser(str, Enum):
    """Enum for the parser to run."""

    # Dynamically add values from PARSERS.ParserEnum to Parser
    locals().update(PARSERS.ParserEnum.__members__)


def enum_action(enum_class):
    class EnumAction(Action):
        def __init__(self, *args, **kwargs):
            table = {member.name.casefold(): member for member in enum_class}
            super().__init__(
                *args,
                choices=table,
                **kwargs,
            )
            self.table = table

        def __call__(self, parser, namespace, values, option_string=None):
            setattr(namespace, self.dest, self.table[values])

    return EnumAction


@flow()
def fetch_parse_validate(
    parser: Parser,
    yaml_path: str,
    s3_path: str,
    work_dir: str,
    taxdump_path: Optional[str] = None,
    append: bool = False,
    dry_run: bool = False,
    min_valid: int = 0,
    min_assigned: int = 0,
) -> None:
    """
    Fetch, parse, and validate the TSV file.

    Args:
        parser (Parser): The parser to use.
        yaml_path (str): Path to the source YAML file.
        s3_path (str): Path to the TSV directory on S3.
        work_dir (str): Path to the working directory.
        taxdump_path (str, optional): Path to an NCBI format taxdump.
        append (bool, optional): Flag to append values to an existing TSV file(s).
        dry_run (bool, optional): Flag to run the flow without updating s3/git files.
        min_valid (int, optional): Minimum expected number of valid rows.
        min_assigned (int, optional): Minimum expected number of assigned taxa.
    """
    header_status = fetch_previous_file_pair(
        yaml_path=yaml_path, s3_path=s3_path, work_dir=work_dir
    )
    if not header_status:
        # If the headers do not match, set append == False to parse all records
        append = False
    working_yaml = os.path.join(work_dir, os.path.basename(yaml_path))
    file_parser = PARSERS.parsers[parser.name]
    file_parser.func(working_yaml=working_yaml, work_dir=work_dir, append=append)
    if dry_run:
        # set s3_path = None to skip copying the validated file to S3/git
        s3_path = None
    validate_file_pair(
        yaml_path, work_dir, taxdump_path, s3_path, min_valid, min_assigned
    )


def parse_args() -> Namespace:
    """
    Parse command-line arguments.

    Returns:
        Namespace: The parsed arguments.
    """
    parser = ArgumentParser(description="Fetch previous TSV file.")

    parser.add_argument(
        "-p",
        "--parser",
        action=enum_action(Parser),
        required=True,
        help="Parser to use.",
    )

    command_line_args = [
        YAML_PATH,
        S3_PATH,
        WORK_DIR,
        TAXDUMP_PATH,
        APPEND,
        DRY_RUN,
        MIN_VALID,
        MIN_ASSIGNED,
    ]
    for arg in command_line_args:
        parser.add_argument(*arg["flags"], **arg["keys"])

    return parser.parse_args()


if __name__ == "__main__":
    """Run the flow."""
    args = parse_args()
    fetch_parse_validate(**vars(args))
