#!/usr/bin/env python3
"""NCBI functions."""

import gzip
import re
from collections import Counter

from Bio import SeqIO
from tolkein import tofetch
from tolkein import tofile
from tolkein import tolog
from tqdm import tqdm

LOGGER = tolog.logger(__name__)

REFSEQ_FTP = "https://ftp.ncbi.nlm.nih.gov/refseq/release"


def refseq_listing(collection):
    """Fetch a directory listing for a RefSeq collection."""
    pattern = re.compile(r"(\w+\.\d+\.genomic\.gbff\.gz)")
    url = "%s/%s" % (REFSEQ_FTP, collection)
    html = tofetch.fetch_url(url)
    listing = []
    for line in html.split("\n"):
        match = pattern.search(line)
        if match:
            listing.append("%s/%s" % (url, match.group()))
    return listing


def parse_references(entry, fields=None):
    """Parse references."""
    if fields is None:
        fields = {}
    submitted_year = re.compile(r"Submitted\s\(\d{2}-\w{3}-(\d{4})\)")
    published_year = re.compile(r"\s\((\d{4})\)[^\(]*$")
    for reference in entry.annotations["references"]:
        if reference.journal == "Unpublished":
            continue
        elif reference.journal.startswith("Submitted"):
            if "source_author" in fields:
                continue
            fields["source_year"] = submitted_year.search(reference.journal).group(1)
        elif "source_author" in fields:
            continue
        else:
            fields["source_year"] = published_year.search(reference.journal).group(1)
            if reference.title:
                fields["source_title"] = reference.title
            if reference.pubmed_id:
                fields["pubmed_id"] = reference.pubmed_id
        if reference.authors:
            fields["source_author"] = reference.authors
        elif reference.consrtm:
            fields["source_author"] = reference.consrtm
    return fields


def parse_xrefs(entry, fields=None):
    """Parse xrefs."""
    if fields is None:
        fields = {}
    if entry.dbxrefs:
        bioprojects = []
        biosamples = []
        for dbxref in entry.dbxrefs:
            key, value = dbxref.split(":")
            if key == "BioProject":
                bioprojects.append(value)
            elif key == "BioSample":
                biosamples.append(value)
        if bioprojects:
            fields["bioproject"] = "; ".join(bioprojects)
        if biosamples:
            fields["biosample"] = "; ".join(biosamples)
    return fields


def parse_features(entry, fields):
    """Parse features."""
    if fields is None:
        fields = {}
    qualifiers = entry.features[0].qualifiers
    if "db_xref" in qualifiers:
        for xref in qualifiers["db_xref"]:
            key, value = xref.split(":")
            if key == "taxon":
                fields["taxon_id"] = value
    if "lat_lon" in qualifiers:
        fields["sample_location"] = qualifiers["lat_lon"]
    return fields


def parse_flatfile(flatfile, organelle, opts):
    """Parse a GenBank flatfile."""
    data = []
    comment_re = re.compile(
        r"(?:derived|identical)\s(?:from|to)\s([\w\d]+).*COMPLETENESS: full length",
        re.DOTALL,
    )
    with gzip.open(flatfile, "rt") as fh:
        gb = SeqIO.parse(fh, "gb")
        # ctr = 0
        for entry in tqdm(gb):
            if (
                "refseq-root" in opts
                and opts["refseq-root"] not in entry.annotations["taxonomy"]
            ):
                continue
            fields = {"organelle": organelle}
            if entry.annotations["comment"]:
                match = comment_re.search(entry.annotations["comment"])
                if not match:
                    continue
                fields["genbank_accession"] = match.group(1)
            parse_features(entry, fields)
            parse_references(entry, fields)
            fields["taxon"] = entry.annotations["organism"]
            fields["lineage"] = "; ".join(entry.annotations["taxonomy"])
            fields["assembly_id"] = entry.id
            fields["refseq_accession"] = entry.id
            fields["last_updated"] = entry.annotations["date"]
            parse_xrefs(entry, fields)
            seqstr = str(entry.seq.upper())
            counter = Counter(seqstr)
            length = len(seqstr)
            fields["n_percent"] = float("%.2f" % (counter["N"] / length * 100))
            if fields["n_percent"] == 100:
                continue
            gc_count = counter["G"] + counter["C"]
            fields["gc_percent"] = float(
                "%.2f" % (gc_count / (gc_count + counter["A"] + counter["T"]) * 100)
            )
            fields["assembly_span"] = length
            data.append(fields)
            # ctr += 1
            # if ctr == 20:
            #     break
    return data


def parse_listing(listing, collection, opts):
    """Parse all URLs in a directory listing."""
    parsed = []
    for url in listing:
        LOGGER.info("Fetching %s", url)
        flatfile = tofetch.fetch_tmp_file(url)
        LOGGER.info("Parsing %s", url)
        parsed += parse_flatfile(flatfile, collection, opts)
    return parsed


def refseq_organelle_parser(collections, opts):
    """Fetch and parse RefSeq organelle collections."""
    parsed = []
    if isinstance(collections, tuple):
        for collection in collections:
            listing = refseq_listing(collection)
            parsed += parse_listing(listing, collection, opts)
    else:
        listing = refseq_listing(collections)
        parsed += parse_listing(listing, collections, opts)
    # flatfile = "/Users/rchallis/Downloads/mitochondrion.2.genomic.gbff.gz"
    # collection = "mitochondrion"
    # parsed = parse_flatfile(flatfile, collection, opts)
    return parsed
