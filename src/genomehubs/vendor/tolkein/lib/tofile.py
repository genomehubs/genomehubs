#!/usr/bin/env python3

# pylint: disable=c-extension-no-member

"""Read, write and parse files."""

import csv
import gzip
import io
import os
import pathlib
import sys
from itertools import groupby
from subprocess import PIPE
from subprocess import Popen

import ujson
import yaml


def open_file_handle(filename):
    """
    Open a filehandle.

    Automatically detect gzipped files based on suffix.

    Args:
        filename (str): Name of file to read.

    Returns:
        An open filehandle. Will return None if the file cannot be opened.
    """
    if ".gz" in pathlib.Path(filename).suffixes:
        try:
            return gzip.open(filename, "rt")
        except OSError:
            return None
    try:
        return open(filename, "r")
    except IOError:
        return None


def read_file(filename):
    """
    Read a whole file into memory.

    Automatically detect gzipped files based on suffix.

    Args:
        filename (str): Name of file to read.

    Returns:
        str: Content of file as a string. Will return None if file cannot be read.
    """
    try:
        with open_file_handle(filename) as fh:
            return fh.read()
    except AttributeError:
        return None


def stream_fasta(filename):
    """
    Stream a FASTA file, sequence by sequence.

    Automatically detect gzipped files based on suffix.

    Args:
        filename (str): Name of FASTA file to read.

    Yields:
        A tuple of::

            (
                str: Sequence ID,
                str: Sequence string
            )
    """
    if ".gz" in pathlib.Path(filename).suffixes:
        cmd = ["pigz", "-dc", filename]
    else:
        cmd = ["cat", filename]
    with Popen(cmd, stdout=PIPE, encoding="utf-8", bufsize=4096) as proc:
        faiter = (x[1] for x in groupby(proc.stdout, lambda line: line[0] == ">"))
        for header in faiter:
            seq_id = header.__next__().split()[0].replace(">", "")
            seq_str = "".join(map(lambda s: s.strip(), faiter.__next__()))
            yield seq_id, seq_str


def load_yaml(filename):
    """
    Parse a JSON/YAML file.

    Args:
        filename (str): Name of JSON/YAML file to parse.

    Returns:
        Dict or list of file content.
    """
    data = read_file(filename)
    if data is None:
        return data
    if ".json" in filename:
        content = ujson.loads(data)
    elif ".yaml" in filename or ".yml" in filename:
        content = yaml.full_load(data)
    else:
        content = data
    return content


def write_file(filename, data, *, plain=False):
    """
    Write a file, use suffix to determine type and compression.

    - types: '.json', '.yaml'
    - compression: None, '.gz'

    Args:
        filename (str): Name of FASTA file to read.
        data: data to write to file.
        plain (bool, optional): Whether to treat data as plain text. Defaults to False.

    Returns:
        bool: Whether file was written successfully.
    """
    if ".json" in filename:
        content = ujson.dumps(data, indent=1, escape_forward_slashes=False)
    elif ".yaml" in filename or ".yml" in filename:
        content = yaml.dump(data, indent=1)
    elif filename == "STDOUT":
        sys.stdout.write(
            ujson.dumps(data, indent=1, escape_forward_slashes=False) + "\n"
        )
        return True
    elif filename == "STDOUT":
        sys.stderr.write(
            ujson.dumps(data, indent=1, escape_forward_slashes=False) + "\n"
        )
        return True
    elif plain:
        content = "\n".join(data)
    elif ".csv" in filename or ".tsv" in filename:
        output = io.StringIO()
        if ".csv" in filename:
            writer = csv.writer(output, quoting=csv.QUOTE_NONNUMERIC)
        else:
            writer = csv.writer(output, delimiter="\t")
        for row in data:
            writer.writerow(row)
        content = output.getvalue()
    else:
        content = data
    if ".gz" in filename:
        try:
            with gzip.open(filename, "wt") as fh:
                fh.write(content)
        except TypeError:
            with open(filename, "wb") as fh:
                fh.write(content)
        except OSError:
            return False
    else:
        try:
            with open(filename, "wt") as fh:
                fh.write(content)
        except TypeError:
            with open(filename, "wb") as fh:
                fh.write(content)
        except IOError:
            return False
    return True


def delete_file(filename):
    """
    Delete a file if exists.

    Args:
        filename (str): Name of file to delete.
    """
    if os.path.exists(filename):
        os.remove(filename)


if __name__ == "__main__":
    import doctest

    doctest.testmod()
