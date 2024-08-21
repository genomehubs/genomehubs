#!/usr/bin/env python

import contextlib
import csv
import gzip
import io
import json
import pathlib
from collections.abc import Generator, Iterator
from functools import reduce
from typing import IO, Any, Callable, Optional, Union

import boto3
from botocore.exceptions import ClientError
import yaml  # type: ignore


def parse_jsonl_file(file_path: str) -> Generator[dict, None, None]:
    """
    Parses a JSONL file and yields each line as a JSON object.

    Args:
        file_path (str): The path to the JSONL file to parse.

    Yields:
        dict: A JSON object parsed from each line in the JSONL file.

    Raises:
        FileNotFoundError: If the specified file does not exist.
    """
    if not pathlib.Path(file_path).exists():
        raise FileNotFoundError(f"{file_path} does not exist")

    with open(file_path, "r") as f:
        for line in f:
            yield json.loads(line)


def load_yaml(yaml_path: str) -> dict:
    """
    Loads a YAML file from the specified path.

    Args:
        yaml_path (str): The path to the YAML file.

    Returns:
        dict: The data loaded from the YAML file.

    Raises:
        FileNotFoundError: If the specified YAML file does not exist.
    """
    if not pathlib.Path(yaml_path).exists():
        raise FileNotFoundError(f"{yaml_path} does not exist")

    with open(yaml_path, "r") as f:
        return yaml.safe_load(f)


def parse_path(path_str: str) -> Optional[Any]:
    """
    Parses a dot-separated path string and retrieves the corresponding data from a
    nested dictionary or list of dictionaries.

    Args:
        path_str (str): A dot-separated path string to the desired data.

    Returns:
        The data at the specified path, or None if the path does not exist.
    """
    keys = path_str.split(".")

    def get_key(
        data: Union[dict[str, Any], list[dict[str, Any]]], key: str
    ) -> Optional[Any]:
        """
        Retrieves the value of a key from a dictionary or a list of dictionaries.

        Args:
            data (dict or list): The dictionary or list of dictionaries to search.
                key (str): The key to search for.

        Returns:
            The value of the key, or None if the key does not exist or the data is not
            a dictionary or list of dictionaries.
        """
        if isinstance(data, dict):
            return data.get(key)
        elif isinstance(data, list):
            if "==" in key:
                key, value = key.split("==")
                return [d for d in data if d.get(key) == value]
            flat_list = []
            for d in data:
                if key not in d:
                    continue
                if isinstance(d[key], list):
                    flat_list.extend(d[key])
                else:
                    flat_list.append(d[key])
            return flat_list
        else:
            return None

    def get_data(data: Union[dict[str, Any], list[dict[str, Any]]]) -> Optional[Any]:
        """
        Recursively retrieves the value at the specified path from a nested dictionary
        or list of dictionaries.

        Args:
            data (dict or list): The dictionary or list of dictionaries to search.

        Returns:
            The value at the specified path, or None if the path does not exist.
        """

        def reducer(d, key):
            """
            Retrieves the value of a key from a dictionary or a list of dictionaries.

            Args:
                d (dict or list): The dictionary or list of dictionaries to search.
                key (str): The key to search for.

            Returns:
                The value of the key, or None if the key does not exist or the data is
                not a dictionary or list of dictionaries.
            """
            return get_key(d, key)

        return reduce(reducer, keys, data)

    return get_data


def get_path_header(data: dict[str, Any]) -> Iterator[tuple[str, str]]:
    """
    Yields the path and header for each object in the "attributes", "identifiers", and
    "taxonomy" sections of the provided data.

    Args:
        data (dict): The data to search for path and header information.

    Yields:
        tuple[str, str]: The path and header for each matching object.
    """
    for section in ["attributes", "identifiers", "metadata", "names", "taxonomy"]:
        for _, obj in data.get(section, {}).items():
            if isinstance(obj, dict) and "path" in obj and "header" in obj:
                yield obj["path"], obj["header"]


def set_headers(config: dict[str, Any]) -> list[str]:
    """
    Retrieves a list of all headers defined in the "attributes", "identifiers",
    "metadata", "names", and "taxonomy" sections of the provided configuration.

    Args:
        config (dict): The configuration dictionary containing the section data.

    Returns:
        list: A list of all unique headers found in the specified sections.
    """
    headers: list[str] = []
    for section in ["attributes", "identifiers", "metadata", "names", "taxonomy"]:
        for key, value in config.get(section, {}).items():
            if isinstance(value, dict):
                if "header" in value and value["header"] not in headers:
                    headers.append(value["header"])
    return headers


def get_parse_functions(
    config: dict[str, Any]
) -> dict[str, Callable[[dict[str, Any]], Any]]:
    """
    Generates a dictionary of parse functions based on the path and header information
    extracted from the "attributes", "identifiers", and "taxonomy" sections of the
    provided configuration data.

    The `get_path_header` function is used to iterate through the relevant sections of
    the configuration data and yield the path and header for each object. The
    `parse_path` function is then used to create a parse function for each path, and
    the resulting dictionary is returned.

    Args:
        config (dict): The configuration data to extract path and header information
            from.

    Returns:
        dict: A dictionary mapping headers to their corresponding parse functions.
    """
    return {
        header: parse_path(path) or (lambda _: None)
        for path, header in get_path_header(config)
    }


def parse_report_values(
    parse_fns: dict[str, Callable[[dict], Any]], data: dict
) -> dict[str, Any]:
    """
    Applies a set of parsing functions to the provided data and returns a dictionary
    with the parsed values.

    Args:
        parse_fns (dict): A dictionary mapping header names to parsing functions.
        data (dict): The data to be parsed.

    Returns:
        dict: A dictionary with the parsed values, where the keys are the header names
            and the values are the results of applying the corresponding parsing
            functions to the data.
    """
    return {header: parse_fn(data) for header, parse_fn in parse_fns.items()}


def format_entry(entry: Union[str, list], key: str, meta: dict) -> str:
    """
    Formats a single entry in a dictionary, handling the case where the entry is a list.

    Args:
        entry (Union[str, list]): The entry to be formatted, which may be a single
            value or a list of values.
        key (str): The key associated with the entry.
        meta (dict): A dictionary containing metadata, including a "separators"
            dictionary that maps keys to separator strings.

    Returns:
        str: The formatted entry, where list elements are joined using the separator
            specified in the "separators" dictionary.
    """
    if not isinstance(entry, list):
        return str(entry)
    return (
        meta["separators"].get(key, ",").join([str(e) for e in entry if e is not None])
    )


def print_to_tsv(headers: list[str], rows: list[dict], meta: dict):
    """
    Writes the provided headers and rows to a TSV file with the specified file name.

    Args:
        headers (list[str]): A list of column headers to write to the file.
        rows (list[dict]): A list of dictionaries, where each dictionary represents a
            row of data and the keys correspond to the column headers.
        meta (dict): A dictionary containing metadata, including the "file_name" key
            which specifies the output file name.
    """
    with open(meta["file_name"], "w") as f:
        f.write("\t".join(headers) + "\n")
        for row in rows:
            f.write(
                "\t".join(
                    [format_entry(row.get(col, []), col, meta) for col in headers]
                )
                + "\n"
            )


def append_to_tsv(headers: list[str], rows: list[dict], meta: dict):
    """
    Appends the provided rows to a TSV file with the specified file name.

    Args:
        headers (list[str]): A list of column headers.
        rows (list[dict]): A list of dictionaries, where each dictionary represents a
            row of data and the keys correspond to the column headers.
        meta (dict): A dictionary containing metadata, including the "file_name" key
            which specifies the output file name.
    """
    with open(meta["file_name"], "a") as f:
        for row in rows:
            f.write(
                "\t".join(
                    [format_entry(row.get(col, []), col, meta) for col in headers]
                )
                + "\n"
            )


def extract_file_paths(config, attribute):
    """
    Extract file paths based on a specified attribute from a parsed YAML file.

    Args:
        yaml_data (dict): The parsed contents of a YAML file.
        attribute (str): The attribute key to extract file paths from.

    Returns:
        dict: A dictionary containing the extracted file paths, or an
              empty dictionary if the attribute or file paths are not found.
    """

    file_paths = {}
    with contextlib.suppress(KeyError):
        file_paths = config["attributes"][attribute]["file_paths"]
    return file_paths


def get_metadata(config: dict, yaml_file: str, attribute: Optional[str] = None) -> dict:
    """
    Retrieves metadata information from a configuration file, including the output file
    name and separator values for specific keys.

    Args:
        config (dict): A dictionary containing the configuration settings.
        yaml_file (str): The path to the YAML configuration file.

    Returns:
        dict: A dictionary containing the output file name and a dictionaries of
            headers and separators for specific keys.
    """
    yaml_dir: pathlib.Path = pathlib.Path(yaml_file).parent
    file_name: str = config.get("file", {}).get("name", "output.tsv")
    separators: dict[str, str] = {}
    headers: dict[str, str] = {}
    with contextlib.suppress(KeyError):
        for key, value in config["attributes"].items():
            if isinstance(value, dict):
                separators[key] = value.get("separator", ",")
                headers[key] = value.get("header", key)
            else:
                separators[key] = ","
                headers[key] = key
    return {
        "file_name": f"{yaml_dir}/{file_name}",
        "file_paths": extract_file_paths(config, attribute),
        "headers": headers,
        "separators": separators,
    }


def write_tsv(parsed: dict[str, dict], headers: list[str], meta: dict):
    """
    Writes the parsed data to a TSV file using the provided headers and metadata.

    Args:
        parsed (dict[str, dict]): A dictionary containing the parsed data, where the
            keys are the row identifiers and the values are dictionaries representing
            the rows.
        headers (list[str]): A list of column headers to write to the file.
        meta (dict): A dictionary containing metadata, including the "file_name" key
            which specifies the output file name.
    """
    rows = list(parsed.values())
    print_to_tsv(headers, rows, meta)


def write_yaml(yaml_data: dict, yaml_file: str):
    """
    Writes a dictionary to a YAML file.

    Args:
        yaml_data (dict): The data to write to the YAML file.
        yaml_file (str): The path to the YAML file to write the data to.
    """
    with open(yaml_file, "w") as f:
        yaml.dump(yaml_data, f, default_flow_style=False)


def parse_previous(
    f: IO[str],
    key_name: str,
    headers: Optional[list[str]] = None,
    delimiter: str = "\t",
) -> dict[str, dict[str, str]]:
    """Parses a TSV file containing previous dataset information and returns a
    dictionary of rows, where the keys are the identifiers and
    the values are dictionaries representing the rows.

    Args:
        f (IO[str]): The file-like object containing the TSV data.
        key_name (str): The name of the key column.
        headers (list[str]): A list of column headers expected in the TSV file.
        delimiter (str): The delimiter used in the TSV file.

    Returns:
        dict[str, dict[str, str]]: A dictionary where the keys are the identifiers
            and the values are dictionaries representing the rows.

    Raises:
        ValueError: If the headers in the TSV file do not match the provided
            headers.
    """
    reader = csv.reader(f, delimiter=delimiter)
    header = next(reader)
    if headers is not None and header != headers:
        raise ValueError("Headers do not match")

    rows: dict[str, dict[str, str]] = {}
    for row in reader:
        row_dict = {header[i]: row[i] for i in range(len(header))}
        if row_dict[key_name] in rows:
            if isinstance(rows[row_dict[key_name]], list):
                rows[row_dict[key_name]].append(row_dict)
            else:
                rows[row_dict[key_name]] = [rows[row_dict[key_name]], row_dict]
        else:
            rows[row_dict[key_name]] = row_dict
    return rows


def load_previous(
    file_path: pathlib.Path,
    key_name: str,
    headers: Optional[list[str]] = None,
    delimiter: str = "\t",
) -> dict[str, dict]:
    """
    Loads the previous data from a TSV file at the given file path.

    Args:
        file_path (pathlib.Path): The path to the TSV file containing the previous data.
        key_name (str): The name of the key column.
        headers (list[str]): The expected headers for the TSV file.
        delimiter (str): The delimiter used in the TSV file.

    Returns:
        dict[str, dict]: A dictionary where the keys are the "key_name" values
            and the values are dictionaries representing the rows.
    """
    file_path = pathlib.Path(file_path)
    if not file_path.exists():
        return {}

    open_fh = (
        gzip.open(str(file_path), "rt", encoding="utf-8")
        if file_path.suffix == ".gz"
        else open(str(file_path), "rt", encoding="utf-8")
    )
    try:
        with open_fh as f:
            return parse_previous(f, key_name, headers, delimiter)
    except ValueError:
        return {}


def get_directories_by_prefix(s3: Any, bucket: str, prefix: str) -> list[str]:
    """
    Get all directories with a specified prefix in an S3 bucket.

    Args:
        s3: The S3 client to use for retrieving the latest directory.
        bucket (str): The name of the S3 bucket.
        prefix (str): The prefix within the bucket to return.

    Returns:
        list: The paths of the directories found with the specified prefix.
    """

    result = s3.list_objects_v2(Bucket=bucket, Prefix=f"{prefix}/", Delimiter="/")
    return [
        obj["Prefix"]
        for obj in sorted(result.get("CommonPrefixes", []), key=lambda x: x["Prefix"])
    ]


def list_subdirectories(s3: Any, bucket: str, prefix: str) -> list[str]:
    """
    List subdirectories within a specified prefix in an S3 bucket.

    Args:
        s3: The S3 client to use for listing subdirectories.
        bucket (str): The name of the S3 bucket.
        prefix (str): The prefix within the bucket to list subdirectories from.

    Returns:
        list: A list of subdirectory names found within the specified prefix.
    """

    names: list[str] = []
    next_token: str = ""
    while next_token is not None:
        kwargs = {"Bucket": bucket, "Prefix": prefix, "Delimiter": "/"}
        if next_token:
            kwargs["ContinuationToken"] = next_token
        result = s3.list_objects_v2(**kwargs)
        for prefix in result.get("CommonPrefixes", []):
            subdir = prefix["Prefix"].split("/")[-2]
            names.append(subdir)
        next_token = result.get("NextContinuationToken")
    return names


def list_files(s3: Any, bucket: str, prefix: str, recursive: bool = False) -> list[str]:
    """
    List files within a specified prefix in an S3 bucket.

    Args:
        s3: The S3 client to use for listing files.
        bucket (str): The name of the S3 bucket.
        prefix (str): The prefix within the bucket to list files from.
        recursive (bool): Whether to list files recursively or not.

    Returns:
        list: A list of file names found within the specified prefix.
    """

    names: list[str] = []
    next_token: str = ""
    while next_token is not None:
        kwargs = {"Bucket": bucket, "Prefix": prefix, "Delimiter": "/"}
        if next_token:
            kwargs["ContinuationToken"] = next_token
        result = s3.list_objects_v2(**kwargs)
        names.extend(entry["Key"] for entry in result.get("Contents", []))
        next_token = result.get("NextContinuationToken")
        if recursive:
            prefixes = result.get("CommonPrefixes", [])
            for prefix_entry in prefixes:
                sub_prefix = prefix_entry["Prefix"]
                names.extend(list_files(s3, bucket, sub_prefix, recursive))
    return names


def check_s3_file_exists(s3: Any, bucket: str, key: str) -> bool:
    """
    Check if a file exists in an S3 bucket.

    Args:
        s3 (boto3.client): S3 client object
        bucket (str): Name of the S3 bucket
        key (str): Key of the file to check

    Returns:
        bool: True if the file exists, False otherwise
    """
    try:
        s3.head_object(Bucket=bucket, Key=key)
        return True
    except ClientError:
        return False


def get_s3_client(endpoint_url: str) -> boto3.client:
    """Get an S3 client.

    Args:
      endpoint_url: The endpoint URL for the S3 service.

    Returns:
      boto3.client: An S3 client configured to use the given endpoint.
    """
    return boto3.client(
        "s3",
        endpoint_url=endpoint_url,
    )


def load_json_from_s3(s3: boto3.client, bucket: str, key: str) -> dict:
    """Load JSON data from an S3 object.

    Deserializes JSON from an S3 object, automatically decompressing
    gzipped data if needed.

    Args:
      s3: boto3 S3 client
      bucket: S3 bucket name
      key: S3 object key

    Returns:
      The deserialized JSON data.
    """
    obj = s3.get_object(Bucket=bucket, Key=key)

    with io.BytesIO(obj["Body"].read()) as bio:
        if bio.read(2) == b"\x1f\x8b":  # Gzip magic number
            bio.seek(0)
            with gzip.GzipFile(fileobj=bio) as gzipfile:
                data = json.load(gzipfile)
        else:
            bio.seek(0)
            data = json.load(bio)
    return data


def load_tsv_from_s3(
    s3: boto3.client, bucket: str, key: str, skip: int = 0
) -> list[dict]:
    """
    Load TSV data from an S3 object.

    Args:
        s3 (boto3.client): S3 client object.
        bucket (str): Name of the S3 bucket.
        key (str): Key of the TSV file to load.
        skip (int): Number of rows to skip at the start of the file.

    Returns:
        list[dict]: A list of dictionaries representing the rows of the TSV file.
    """
    obj = s3.get_object(Bucket=bucket, Key=key)
    with io.BytesIO(obj["Body"].read()) as bio:
        with (
            gzip.open(bio, "rt", encoding="utf-8")
            if key.endswith(".gz")
            else io.TextIOWrapper(bio, encoding="utf-8")
        ) as f:
            while skip > 0:
                next(f)
                skip -= 1
            reader = csv.DictReader(f, delimiter="\t")
            return list(reader)
