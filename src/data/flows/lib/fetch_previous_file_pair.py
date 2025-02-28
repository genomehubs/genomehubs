#!/usr/bin/env python3

import argparse
import gzip
import os
import shutil
import sys
from os.path import abspath, dirname

import boto3
import utils

from conditional_import import emit_event, flow, task, NO_CACHE
from shared_tasks import get_filenames
from utils import Config
from shared_args import S3_PATH, WORK_DIR, YAML_PATH


@task(retries=2, retry_delay_seconds=2)
def fetch_tsv_file(remote_file: str, local_file: str) -> int:
    """
    Fetch the TSV file from the remote path using boto3.

    Args:
        remote_file (str): Path to the remote TSV file.
        local_file (str): Path to the local TSV file.

    Returns:
        int: Number of lines written to the local file.
    """
    s3 = boto3.client("s3")
    bucket_name, key = remote_file.replace("s3://", "").split("/", 1)

    try:
        s3.head_object(Bucket=bucket_name, Key=key)
    except s3.exceptions.ClientError:
        # Return 0 if the remote file does not exist
        return 0

    # fetch the file
    os.makedirs(os.path.dirname(local_file), exist_ok=True)
    with open(local_file, "wb") as f:
        s3.download_fileobj(bucket_name, key, f)

    # Check if the file is gzipped
    if local_file.endswith(".gz"):
        with gzip.open(local_file, "rt") as f:
            line_count = sum(1 for _ in f)
    else:
        with open(local_file, "r") as f:
            line_count = sum(1 for _ in f)
    print(f"Downloaded {line_count} lines from {remote_file} to {local_file}")

    subdirs = ["names", "exclusions"]
    # check if a file with the same name exists in the subdirs on S3
    # if so make sure a local subdir exists and move the file there
    filename = os.path.basename(local_file)
    for subdir in subdirs:
        subdir_remote_file = os.path.join(
            os.path.dirname(remote_file), subdir, filename
        )
        print(f"Checking for {subdir_remote_file}")
        bucket_name, key = subdir_remote_file.replace("s3://", "").split("/", 1)
        try:
            s3.head_object(Bucket=bucket_name, Key=key)
        except s3.exceptions.ClientError:
            continue
        subdir_local_file = os.path.join(os.path.dirname(local_file), subdir, filename)
        print(f"Moving {subdir_remote_file} to {subdir_local_file}")
        os.makedirs(os.path.dirname(subdir_local_file), exist_ok=True)
        with open(subdir_local_file, "wb") as f:
            s3.download_fileobj(bucket_name, key, f)
        # local_file = subdir_local_file

    return line_count


@task(cache_policy=NO_CACHE)
def compare_headers(config: Config, local_file: str) -> bool:
    """
    Compare headers in the local and remote TSV files.

    Args:
        config (Config): YAML file as a dictionary.
        local_file (str): Path to the local TSV file.

    Returns:
        bool: True if the headers are the same, False otherwise.
    """
    # If local file does not exist, return False
    if not os.path.exists(local_file):
        return False

    # Get the headers from the local TSV file
    if local_file.endswith(".gz"):
        with gzip.open(local_file, "rt") as f:
            local_headers = f.readline().strip().split("\t")
    else:
        with open(local_file, "r") as f:
            local_headers = f.readline().strip().split("\t")

    # Return True if the headers are the same
    return config.headers == local_headers


@task(cache_policy=NO_CACHE)
def copy_yaml_files(yaml_path: str, config: Config, work_dir: str) -> None:
    """
    Copy the YAML files to the working directory.

    Args:
        yaml_path (str): Path to the YAML file.
        config (Config): YAML file as a dictionary.
        work_dir (str): Path to the working directory.
    """
    # Copy the file at yaml_path to the working directory
    shutil.copy(yaml_path, work_dir)

    # Copy any dependencies to the working directory
    if "needs" in config.config["file"]:
        source_dir = os.path.dirname(yaml_path)
        for file in config.config["file"]["needs"]:
            file_path = os.path.join(source_dir, file)
            shutil.copy(file_path, work_dir)


@flow()
def fetch_previous_file_pair(yaml_path: str, s3_path: str, work_dir: str) -> None:
    """
    Fetch the previous YAML/TSV files and compare headers.

    Args:
        yaml_path (str): Path to the YAML file.
        s3_path (str): Path to the TSV directory on S3.
        work_dir (str): Path to the working directory.
    """
    config = utils.load_config(yaml_path)
    (local_file, remote_file) = get_filenames(config, s3_path, work_dir)
    line_count = fetch_tsv_file(remote_file, local_file)
    copy_yaml_files(yaml_path, config, work_dir)
    status = compare_headers(config, local_file)
    emit_event(
        event="fetch.previous.file.pair.completed",
        resource={
            "prefect.resource.id": f"fetch.previous.{yaml_path}",
            "prefect.resource.type": "fetch.previous",
            "prefect.resource.matches.previous": "yes" if status else "no",
        },
        payload={"line_count": line_count, "headers_match": status},
    )
    return status


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Fetch previous YAML/TSV files.")

    command_line_args = [YAML_PATH, S3_PATH, WORK_DIR]
    for arg in command_line_args:
        parser.add_argument(*arg["flags"], **arg["keys"])

    return parser.parse_args()


if __name__ == "__main__":
    """Run the flow."""
    args = parse_args()

    fetch_previous_file_pair(
        yaml_path=args.yaml_path,
        s3_path=args.s3_path,
        work_dir=args.work_dir,
    )
