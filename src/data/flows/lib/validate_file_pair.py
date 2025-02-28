#!/usr/bin/env python3

import argparse
import json
import os
import shutil
import subprocess
import sys
from typing import Optional

import boto3
import utils
from conditional_import import emit_event, flow, task
from shared_tasks import get_filenames
from shared_args import MIN_ASSIGNED, MIN_VALID, S3_PATH, TAXDUMP_PATH, WORK_DIR, YAML_PATH


@task(log_prints=True)
def validate_yaml_file(
    yaml_path: str,
    taxdump_path: Optional[str] = None,
    min_valid: int = 0,
    min_assigned: int = 0,
) -> bool:
    """
    Validate the YAML file using blobtk validate.

    Args:
        yaml_path (str): Path to the YAML file.
        taxdump_path (str): Path to an NCBI format taxdump.
        min_valid (int): Minimum expected number of valid rows.
        min_assigned (int): Minimum expected number of assigned taxa.

    Returns:
        bool: True if the YAML file is valid, False otherwise.
    """
    # Validate the YAML file using blobtk validate
    cmd = ["blobtk", "validate", "-g", yaml_path]
    if taxdump_path is not None:
        cmd.extend(
            [
                "-t",
                taxdump_path,
                "-n",
                "scientific name",
            ]
        )

    # Run the command with subprocess run and capture stdout
    result = subprocess.run(cmd, stdout=subprocess.PIPE, text=True)
    status = result.returncode == 0
    output = result.stdout
    sys.stdout.write(output)
    validation_report = None
    taxonomy_report = None
    for line in output.splitlines():
        if line.startswith("{") and line.endswith("}"):
            if validation_report is None:
                validation_report = json.loads(line)
            elif taxonomy_report is None:
                taxonomy_report = json.loads(line)

    return (status, validation_report, taxonomy_report)


@task()
def transfer_validated(yaml_path: str, work_dir: str, s3_path: str) -> None:
    """
    Transfer the validated YAML file to S3.

    Args:
        yaml_path (str): Path to the validated YAML file.
        work_dir (str): Path to the working directory.
        s3_path (str): Path to the TSV directory on S3.
    """
    config = utils.load_config(yaml_path)
    local_yaml_path = os.path.join(work_dir, os.path.basename(yaml_path))
    (local_tsv_path, remote_tsv_path) = get_filenames(config, s3_path, work_dir)

    # Transfer the validated TSV file to S3
    bucket, key = s3_path.removeprefix("s3://").split("/", 1)
    s3 = boto3.client("s3")
    s3.upload_file(local_tsv_path, bucket, key)
    print(f"Uploaded {local_tsv_path} to {remote_tsv_path}")

    # Copy the local YAML file to yaml_path on local disk
    shutil.copy(local_yaml_path, yaml_path)
    print(f"Copied {local_yaml_path} to {yaml_path}")

    # TODO: handle names, exclusions, and other subdirectories


@task()
def check_min_counts(validation_report, taxonomy_report, min_valid, min_assigned):
    """
    Check if the validation and taxonomy reports meet the minimum counts.

    Args:
        validation_report (dict): The validation report.
        taxonomy_report (dict): The taxonomy report.
        min_valid (int): Minimum expected number of valid rows.
        min_assigned (int): Minimum expected number of assigned taxa.
    """
    if validation_report is not None:
        valid_count = int(validation_report.get("valid", 0))
        if valid_count < min_valid:
            raise ValueError(
                f"Expected at least {min_valid} valid rows, found {valid_count}"
            )

    if taxonomy_report is not None:
        assigned_count = int(taxonomy_report.get("assigned", 0))
        if assigned_count < min_assigned:
            raise ValueError(
                f"Expected at least {min_assigned} assigned taxa, "
                f"found {assigned_count}"
            )

    return True


@flow()
def validate_file_pair(
    yaml_path: str,
    work_dir: str,
    taxdump_path: Optional[str] = None,
    s3_path: Optional[str] = None,
    min_valid: int = 1,
    min_assigned: int = 1,
) -> None:
    """
    Validate the previous YAML/TSV files.

    Args:
        yaml_path (str): Path to the source YAML file.
        work_dir (str): Path to the working directory.
        taxdump_path (str): Path to an NCBI format taxdump.
        s3_path (str): Path to the TSV directory on S3.
        min_valid (int): Minimum expected number of valid rows.
        min_assigned (int): Minimum expected number of assigned taxa.
    """
    yaml_file_name = os.path.basename(yaml_path)
    local_yaml_path = os.path.join(work_dir, yaml_file_name)
    (status, validation_report, taxonomy_report) = validate_yaml_file(
        local_yaml_path, taxdump_path
    )

    if status:
        check_min_counts(validation_report, taxonomy_report, min_valid, min_assigned)

    if s3_path is not None:
        transfer_validated(local_yaml_path, s3_path)

    emit_event(
        event="validate.file.pair.finished",
        resource={
            "prefect.resource.id": f"validate.file.{yaml_path}",
            "prefect.resource.type": "validate.file",
            "prefect.resource.is.valid": "yes" if status else "no",
        },
        payload={"matches_previous": status},
    )
    return status


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Fetch previous YAML/TSV files.")

    command_line_args = [YAML_PATH, WORK_DIR, S3_PATH, TAXDUMP_PATH, MIN_VALID, MIN_ASSIGNED]
    for arg in command_line_args:
        parser.add_argument(*arg["flags"], **arg["keys"])

    return parser.parse_args()


if __name__ == "__main__":
    """Run the flow."""
    args = parse_args()

    validate_file_pair(**vars(args))
