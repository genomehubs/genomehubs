#!/usr/bin/env python3
"""
Arguments shared between scripts.

Each dictionary in the list represents an argument to be added to the parser.
The dictionary contains two keys:
- flags: A list of strings representing the argument flags.
- keys: A dictionary of keyword arguments to be passed to the parser.

Example:
    S3_PATH = {"flags": ["-s", "--s3_path"], "keys": {"help": "Path to the TSV directory on S3.", "required": True, "type": str}}

    parser.add_argument(*S3_PATH["flags"], **S3_PATH["keys"])
"""

import argparse

API_URL = {
    "flags": ["--api_url"],
    "keys": {
        "help": "URL of the API.",
        "type": str,
        "default": "https://goat.genomehubs.org/api/v2"
    }
}

APPEND = {
    "flags": ["-a", "--append"],
    "keys": {
        "help": "Flag to append values to an existing file(s).",
        "action": "store_true"
    }
}

DRY_RUN = {
    "flags": ["-d", "--dry_run"],
    "keys": {
        "help": "Flag to perform a dry run without updating S3/git files.",
        "action": "store_true"
    }
}

INDEX_TYPE = {
    "flags": ["-x", "--index_type"],
    "keys": {
        "help": "Type of index to fetch.",
        "default": "taxon",
        "type": str
    }
}

INPUT_PATH = {
    "flags": ["-i", "--input_path"],
    "keys": {
        "help": "Path to the input file.",
        "required": True,
        "type": str
    }
}

MIN_VALID = {
    "flags": ["--min_valid"],
    "keys": {
        "help": "Minimum expected number of valid rows.",
        "default": 0,
        "type": int
    }
}

MIN_ASSIGNED = {
    "flags": ["--min_assigned"],
    "keys": {
        "help": "Minimum expected number of assigned taxa.",
        "default": 0,
        "type": int
    }
}

OUTPUT_PATH = {
    "flags": ["-o", "--output_path"],
    "keys": {
        "help": "Path to the output file.",
        "required": True,
        "type": str
    }
}

QUERY_OPTIONS = {
    "flags": ["-q", "--query_options"],
    "keys": {
        "help": "Options for the query.",
        "type": str
    }
}

ROOT_TAXID = {
    "flags": ["-r", "--root_taxid"],
    "keys": {
        "default": "2759",
        "help": "Root taxonomic ID for fetching datasets (default: 2759).",
        "type": str
    }
}

S3_PATH = {
    "flags": ["-s", "--s3_path"],
    "keys": {
        "help": "Path to remote file/directory on S3.",
        "required": True,
        "type": str
    }
}

S3_PATH_OPTIONAL = {
    **S3_PATH,
    "keys": {**S3_PATH["keys"], "required": False}
}

TAXDUMP_PATH = {
    "flags": ["-t", "--taxdump_path"],
    "keys": {
        "help": "Path to an NCBI format taxdump.",
        "type": str
    }
}

WORK_DIR = {
    "flags": ["-w", "--work_dir"],
    "keys": {
        "help": "Path to the working directory (default: current directory).",
        "default": ".",
        "type": str
    }
}

YAML_PATH = {
    "flags": ["-y", "--yaml_path"],
    "keys": {
        "help": "Path to the source YAML file.",
        "required": True,
        "type": str
    }
}
