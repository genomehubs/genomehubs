#!/usr/bin/env python3

"""Fetch methods."""

import os
import shutil
import tarfile
import urllib.request as request
import zlib
from contextlib import closing
from typing import Union
from urllib.error import URLError

import requests
from tqdm import tqdm

from .tofile import write_file

url = "ftp://ftp.myurl.com"


class TqdmUpTo(tqdm):
    """Provides `update_to(n)` which uses `tqdm.update(delta_n)`.

    From tqdm documentation.
    """

    def update_to(self, b=1, bsize=1, tsize=None):
        """
        Tqdm update_to method.

        Args:
            b (int, optional): Number of blocks transferred so far [default: 1].
            bsize (int, optional): Size of each block (in tqdm units) [default: 1].
            tsize (int, optional): Total size (in tqdm units).
        """
        if tsize is not None:
            self.total = tsize
        self.update(b * bsize - self.n)  # will also set self.n = b * bsize


def fetch_tmp_file(url):
    """
    Fetch a remote URL to a temporary file.

    Args:
        url (str) : Remote URL to fetch.

    Returns:
        str : Temporary filename.
    """
    with TqdmUpTo(
        unit="B",
        unit_scale=True,
        unit_divisor=1024,
        miniters=1,
        desc="Fetch %s" % url.split("/")[-1],
    ) as t:
        file_tmp = request.urlretrieve(
            url, filename=None, reporthook=t.update_to, data=None
        )[0]
        t.total = t.n
    return file_tmp


def extract_tar(filename, path):
    """
    Extract tarred archive.

    Args:
        filename (str) : Name of tar file to extract.
        path (str) : Path to extract tar file.

    Returns:
        int : Count of file members extracted from tar archive.
    """
    member_count = 0
    with tarfile.open(filename) as tar:
        member_count = len(tar.getmembers())
        # Go over each member
        for member in tqdm(
            iterable=tar.getmembers(), total=member_count, desc="Extract files"
        ):
            # Extract member
            tar.extract(member=member, path=path)
    return member_count


def fetch_tar(url, path):
    """
    Fetch and extract tarred archives.

    Args:
        url (str): Remote URL to fetch.
        path (str): Path to extract tar file.

    Returns:
        int: Count of file members extracted from tar archive.
    """
    file_tmp = fetch_tmp_file(url)
    member_count = extract_tar(file_tmp, path)
    return member_count


def fetch_stream(url, *, decode=True, show_progress=True):
    """
    Stream download.

    Args:
        decode (bool, optional): Determines whether to unzip content. Defaults to True.
        show_progress (bool, optional): Show a progress bar to indicate file streaming
            progress. Defaults to True.

    Yields:
        str: 1024 byte chunk of remote URL.
    """
    res = requests.get(url, stream=True)
    if res.encoding is None:
        res.encoding = "utf-8"
    total_size = int(res.headers.get("content-length", 0))
    block_size = 1024
    if show_progress:
        progress = tqdm(total=total_size, unit="iB", unit_scale=True)
    dec = zlib.decompressobj(32 + zlib.MAX_WBITS)
    for data in res.iter_content(block_size):
        if decode:
            try:
                data = dec.decompress(data)
                if show_progress:
                    progress.update(len(data))
                yield data
            except zlib.error:
                decode = False
        if show_progress:
            progress.update(len(data))
        yield data
    if show_progress:
        progress.close()


def fetch_file(url, path, decode=True):
    """Fetch a remote file.

    Args:
        url (str): Remote URL to fetch.
        path (str): Path to extract tar file.
        decode (bool, optional): Determines whether to unzip content. Defaults to True.
    """
    data = "" if decode else b""
    for part in fetch_stream(url, decode=decode):
        data += part.decode("utf-8") if decode else part
    write_file(path, data)


def fetch_url(url):
    """Fetch a URL.

    Args:
        url (str): Remote URL to fetch.

    Returns:
        str: Content of file as a string. Will return None if response is not OK.
    """
    res = requests.get(url)
    if res.ok:
        return res.content.decode("utf-8")
    return None


def fetch_ftp(url, filename):
    """Fetch a file via ftp."""
    try:
        with closing(request.urlopen(url)) as req:
            with open(filename, "wb") as fh:
                shutil.copyfileobj(req, fh)
    except URLError:
        return None
