#!/usr/bin/env python3

# sourcery skip: avoid-builtin-shadow
import os
import sys
from os.path import abspath, dirname

if __name__ == "__main__" and __package__ is None:
    sys.path.insert(0, dirname(dirname(dirname(abspath(__file__)))))
    __package__ = "flows"

from flows.lib.conditional_import import flow, task  # noqa: E402
from flows.lib.tasks import get_filenames  # noqa: E402
from flows.lib.utils import Config, Parser, load_config  # noqa: E402
from flows.parsers.args import parse_args  # noqa: E402


@task()
def check_tsv_file_exists(config: Config, work_dir: str) -> bool:
    """
    Check if the TSV file exists.

    Args:
        config (Config): YAML file as a dictionary.
        work_dir (str): Path to the working directory.
    """
    # Get the local TSV path
    (local_tsv_path, _) = get_filenames(config, "", work_dir)

    # Check if the TSV file exists
    if not os.path.exists(local_tsv_path):
        raise FileNotFoundError(f"TSV file not found: {local_tsv_path}")


@flow()
def parse_skip_parsing(working_yaml: str, work_dir: str, append: bool) -> None:
    """
    Skip parsing.

    Args:
        working_yaml (str): Path to the working YAML file.
        work_dir (str): Path to the working directory.
        append (bool): Whether to append to the existing TSV file.
    """
    # Get the config from the YAML file
    config = load_config(working_yaml)

    # check the tsv file exists
    check_tsv_file_exists(config, work_dir)


def plugin():
    """Register the flow."""
    return Parser(
        name="SKIP_PARSING",
        func=parse_skip_parsing,
        description="Parse NCBI assemblies from a datasets JSONL file.",
    )


if __name__ == "__main__":
    """Run the flow."""
    args = parse_args()
    parse_skip_parsing(**vars(args))
