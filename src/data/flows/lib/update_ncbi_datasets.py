#!/usr/bin/env python3

import argparse
import hashlib
import os
import subprocess

import boto3
from botocore.exceptions import ClientError
from conditional_import import emit_event, flow, task
from shared_args import OUTPUT_PATH, ROOT_TAXID, S3_PATH_OPTIONAL


@task(retries=2, retry_delay_seconds=2, log_prints=True)
def fetch_ncbi_datasets_summary(
    root_taxid: str,
    file_path: str,
    min_lines: int = 1,
) -> int:
    """
    Fetch NCBI datasets summary for a given root taxID.

    Args:
        file_path (str): Path to the output file.
        root_taxid (str): Root taxonomic ID for fetching datasets.
        min_lines (int): Minimum number of lines in the output file.

    Returns:
        int: Number of lines written to the output file.
    """

    # Fetch datasets summary for the root taxID
    command = [
        "datasets",
        "summary",
        "genome",
        "taxon",
        root_taxid,
        "--as-json-lines",
    ]
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        # Raise an error if the command fails
        raise RuntimeError(f"Error fetching datasets summary: {result.stderr}")

    try:
        print(f"Writing datasets summary to file: {file_path}")
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        # Write to the file and count lines while writing
        line_count = 0
        with open(file_path, "w") as f:
            for line in result.stdout.splitlines():
                f.write(line + "\n")
                line_count += 1

        # Check if the file has at least 10000 lines
        if line_count < min_lines:
            raise RuntimeError(
                f"File {file_path} has less than {min_lines} lines: {line_count}"
            )
    except Exception as e:
        # Raise an error if writing to the file fails
        raise RuntimeError(f"Error writing datasets summary to file: {e}") from e

    # Return the number of lines written to the file
    return line_count


@task(retries=2, retry_delay_seconds=2)
def compare_datasets_summary(local_path: str, s3_path: str) -> bool:
    """
    Compare local and remote NCBI datasets summary files.

    Args:
        local_path (str): Path to the local file.
        s3_path (str): Path to the remote file on s3.

    Returns:
        bool: True if the files are the same, False otherwise.
    """

    # Return error if the local file does not exist
    if not os.path.exists(local_path):
        raise FileNotFoundError(f"Local file {local_path} does not exist")

    s3 = boto3.client("s3")

    # Extract bucket name and key from the S3 path
    def parse_s3_path(s3_path):
        bucket, key = s3_path.removeprefix("s3://").split("/", 1)
        return bucket, key

    bucket, key = parse_s3_path(s3_path)

    # Return false if the remote file does not exist
    try:
        s3.head_object(Bucket=bucket, Key=key)
    except ClientError:
        return False

    # Generate md5sum of the local file
    def generate_md5(file_path):
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

    local_md5 = generate_md5(local_path)

    # Generate md5sum of the remote file
    remote_obj = s3.get_object(Bucket=bucket, Key=key)
    remote_md5 = remote_obj["ETag"].strip('"')

    # Return True if the md5sums are the same
    return local_md5 == remote_md5


@flow()
def update_ncbi_datasets(root_taxid: str, output_path: str, s3_path: str) -> None:
    line_count = fetch_ncbi_datasets_summary(root_taxid, output_path)
    if s3_path:
        status = compare_datasets_summary(output_path, s3_path)
        emit_event(
            event="update.ncbi.datasets.finished",
            resource={
                "prefect.resource.id": f"fetch.datasets.{file_path}",
                "prefect.resource.type": "ncbi.datasets",
                "prefect.resource.matches.previous": "yes" if status else "no",
            },
            payload={"line_count": line_count, "matches_previous": status},
        )
        return status
    return False


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Fetch and parse NCBI datasets.")
    
    command_line_args = [ROOT_TAXID, OUTPUT_PATH, S3_PATH_OPTIONAL]
    for arg in command_line_args:
        parser.add_argument(*arg["flags"], **arg["keys"])

    return parser.parse_args()


if __name__ == "__main__":
    """Run the flow."""
    args = parse_args()

    update_ncbi_datasets(**vars(args))
