#!/usr/bin/env python3
"""INSDC methods."""

import re
from collections import defaultdict
from urllib.parse import urlencode

import ujson
import xmltodict
from tqdm import tqdm

from .tofetch import fetch_stream
from .tofetch import fetch_url

PORTAL = "https://www.ebi.ac.uk/ena/portal/api"


def count_taxon_assembly_meta(root):
    """
    Count INSDC assemblies descended from root taxon.

    Args:
        root (int): Root taxon taxid.

    Returns:
        int: Count of assemblies for taxa descended from root. Will return None on error.
    """
    url = '%s/count?query="tax_tree(%s)"&result=assembly&format=json' % (
        PORTAL,
        str(root),
    )
    count = fetch_url(url)
    if count is None:
        return None
    return int(count)


def fetch_wgs_assembly_meta(root, *, count=-1, offset=0, page=10000):
    """
    Query INSDC WGS assemblies descended from root taxon.

    Args:
        root (int): Root taxon taxid.
        count (int): Number of assemblies to return.
            Default value (-1) returns all assemblies.
        offset (int): Offset of first assembly to return. Defaults to 0.
        page (int): Number of assemblies to fetch per API request. Defaults to 10000.

    Yields:
        dict: A dict of INSDC WGS assembly metadata keyed on sample accession.
    """
    fields = {
        "accession": "wgs_accession",
        "host": "host_scientific_name",
        "first_public": "wgs_first_public",
        "last_updated": "wgs_last_updated",
        "location": "sample_location",
        "study_accession": "study_accession",
        "sample_accession": "sample_accession",
        "sex": "sample_sex",
    }
    options = {
        "fields": ",".join(fields.keys()),
        "format": "json",
        "offset": offset,
        "limit": page,
        "query": '"tax_tree(%d)"' % int(root),
        "result": "wgs_set",
    }
    returned = 0
    wgs_meta = {}
    while returned < count or count == -1:
        url = "%s/search?%s" % (PORTAL, urlencode(options))
        batch_meta = fetch_url(url)
        if not batch_meta or batch_meta is None:
            if not wgs_meta:
                wgs_meta = None
            break
        for entry in ujson.loads(batch_meta):
            wgs_meta[entry["sample_accession"]] = {
                fields[key]: value for key, value in entry.items()
            }
        returned += page
        options["offset"] += page
    return wgs_meta


def stream_taxon_assembly_meta(root, *, count=-1, offset=0, page=10000):
    """
    Query INSDC assemblies descended from root taxon.

    Args:
        root (int): Root taxon taxid.
        count (int): Number of assemblies to return.
            Default value (-1) returns all assemblies.
        offset (int): Offset of first assembly to return. Defaults to 0.
        page (int): Number of assemblies to fetch per API request. Defaults to 10000.

    Yields:
        dict: Normalised dict of INSDC metadata.
    """
    fields = {
        "accession": "gca_accession",
        "study_accession": "study_accession",
        "sample_accession": "sample_accession",
        "secondary_sample_accession": "secondary_sample_accession",
        "assembly_name": "assembly_name",
        "assembly_title": "assembly_title",
        "study_name": "study_name",
        "study_title": "study_title",
        "study_description": "study_description",
        "tax_id": "taxon_id",
        "scientific_name": "scientific_name",
        "strain": "assembled_strain",
        "base_count": "assembly_span",
        "assembly_level": "assembly_level",
        "genome_representation": "genome_representation",
        "last_updated": "last_updated",
        "version": "assembly_version",
        "assembly_type": "assembly_type",
    }
    options = {
        "fields": ",".join(fields.keys()),
        "format": "json",
        "offset": offset,
        "limit": page,
        "query": '"tax_tree(%d)"' % int(root),
        "result": "assembly",
    }
    wgs_meta = fetch_wgs_assembly_meta(root)
    returned = 0
    while returned < count or count == -1:
        url = "%s/search?%s" % (PORTAL, urlencode(options))
        batch_meta = fetch_url(url)
        if not batch_meta or batch_meta is None:
            break
        for entry in ujson.loads(batch_meta):
            entry_meta = {fields[key]: value for key, value in entry.items()}
            if entry_meta["sample_accession"] in wgs_meta:
                entry_meta = {**entry_meta, **wgs_meta[entry_meta["sample_accession"]]}
            yield entry_meta
        returned += page
        options["offset"] += page
