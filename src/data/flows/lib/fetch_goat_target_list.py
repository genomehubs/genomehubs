#!/usr/bin/env python3

import argparse
import requests
import os


from conditional_import import emit_event, flow, task, NO_CACHE
from shared_tasks import get_filenames
from shared_args import API_URL, INDEX_TYPE, QUERY_OPTIONS, ROOT_TAXID, WORK_DIR
from urllib.parse import urlencode


@task()
def fetch_genomehubs_list_file(root_taxid: str, list_file: str, index_type: str, api_url: str, query_options: str = None) -> bool:
    """
    Fetch the list of target records.

    Args:
        root_taxid (str): NCBI Taxonomy ID of the root taxon.
        list_file (str): Path to the taxon list file.
        index_type (str): Type of index to fetch.
        api_url (str): URL of the API.
        query_options (str, optional): Options for the query. Defaults to None.

    Returns:
        record_count (int): Number of records fetched.
    """

    # construct the API URL
    options = {}
    if query_options:
        # split a string like "key1:value1&key2:value2" into a dictionary
        options = dict(x.split(":") for x in query_options.split("&"))
    options["result"] = index_type
    if "query" not in options:
        options["query"] = f"tax_tree({root_taxid})"
    else:
        options["query"] += f" AND tax_tree({root_taxid})"
    url = f"{api_url}/search?{urlencode(options).replace("+", "%20")}"

    print(f"Fetching records from {url}")
    # Fetch the list of target records
    response = requests.get(url, headers={"Accept": "text/tab-separated-values"})
    response.raise_for_status()
    records = response.text
    # write records to file
    with open(list_file, "w") as f:
        f.write(records)
    record_count = len(records.splitlines()) - 1
    print(f"Fetched {record_count} records")
    return record_count


@flow()
def fetch_genomehubs_target_list(root_taxid: str, work_dir: str, api_url: str, index_type: str = "taxon", query_options: str = None) -> None:
    """
    Fetch lists of target records and assemblies.

    Args:
        root_taxid (str): NCBI Taxonomy ID of the root taxon.
        work_dir (str): Path to the working directory.
        api_url (str): URL of the API.
        index_type (str, optional): Type of index to fetch. Defaults to "taxon".
        query_options (str, optional): Options for the query. Defaults to None.
    """

    # Ensure the working directory exists and is writable
    os.makedirs(work_dir, exist_ok=True)
    if not os.access(work_dir, os.W_OK):
        raise ValueError(f"Directory {work_dir} is not writable")

    # Set the output file path
    list_file = f"{work_dir}/{index_type}_list.tsv"
    
    # Fetch the target list
    record_count = fetch_genomehubs_list_file(
        root_taxid=root_taxid,
        list_file=list_file,
        index_type=index_type,
        api_url=api_url,
        query_options=query_options,
    )

    emit_event(
        event="fetch.genomehubs.target.list.completed",
        resource={
            "prefect.resource.id": f"fetch.genomehubs.{index_type}.list.{root_taxid}",
            "prefect.resource.type": "fetch.genomehubs.target.list",
        },
        payload={f"record_count": record_count},
    )
    return record_count


def parse_args():
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description="Fetch previous YAML/TSV files.")

    command_line_args = [ROOT_TAXID, WORK_DIR, INDEX_TYPE, API_URL, QUERY_OPTIONS]
    for arg in command_line_args:
        parser.add_argument(*arg["flags"], **arg["keys"])

    return parser.parse_args()


if __name__ == "__main__":
    """Run the flow."""
    args = parse_args()

    fetch_genomehubs_target_list(
        root_taxid=args.root_taxid,
        work_dir=args.work_dir,
        index_type=args.index_type,
        api_url=args.api_url,
        query_options=args.query_options,
    )
