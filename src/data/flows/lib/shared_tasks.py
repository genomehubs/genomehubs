#!/usr/bin/env python3

import os

from conditional_import import task, NO_CACHE
from utils import Config


@task(cache_policy=NO_CACHE)
def get_filenames(config: Config, s3_path: str, work_dir: str) -> tuple:
    """
    Get local and remote filenames from the YAML and remote path.

    Args:
        config (Config): YAML file as a dictionary.
        s3_path (str): Path to the TSV directory on S3.
        work_dir (str): Path to the working directory.

    Returns:
        tuple: Local and remote filenames.
    """
    try:
        # Get the local filename from the config.file.name attribute
        local_file = config.config["file"]["name"]
    except Exception as e:
        # Raise an error if reading the YAML file fails
        raise RuntimeError("Error reading file name from config") from e

    # Get the remote filename from the s3 path
    remote_file = os.path.join(s3_path, local_file)

    # Append the working directory to the local filename
    local_file = os.path.join(work_dir, local_file)

    return (local_file, remote_file)
