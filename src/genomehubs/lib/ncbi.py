#!/usr/bin/env python3
"""NCBI functions."""

import gzip
import re
from collections import Counter

import ujson
from Bio import SeqIO
from tolkein import tofetch
from tolkein import tofile
from tolkein import tolog
from tqdm import tqdm

from .geo import degrees_to_decimal

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
            try:
                key, value = dbxref.split(":")
                if key == "BioProject":
                    bioprojects.append(value)
                elif key == "BioSample":
                    biosamples.append(value)
            except ValueError:
                pass
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


def reformat_date(string):
    """Change date string format."""
    months = {
        "JAN": "01",
        "FEB": "02",
        "MAR": "03",
        "APR": "04",
        "MAY": "05",
        "JUN": "06",
        "JUL": "07",
        "AUG": "08",
        "SEP": "09",
        "OCT": "10",
        "NOV": "11",
        "DEC": "12",
    }
    parts = re.split(r"[\:\-]", string)
    return "%s-%s-%s" % (parts[2], months[parts[1]], parts[0].zfill(2))


def parse_flatfile(flatfile, organelle, opts):
    """Parse a GenBank flatfile."""
    data = []
    comment_re = re.compile(
        r"(?:derived|identical)\s(?:from|to)\s([\w\d]+).*COMPLETENESS: full length",
        re.DOTALL,
    )
    with gzip.open(flatfile, "rt") as fh:
        gb = SeqIO.parse(fh, "gb")
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
            fields["last_updated"] = reformat_date(entry.annotations["date"])
            parse_xrefs(entry, fields)
            try:
                seqstr = str(entry.seq.upper())
            except Exception:
                LOGGER.warn("Unable to read sequence for %s", entry.id)
                continue
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


def refseq_organelle_parser(collections, opts, *, types=None, names=None):
    """Fetch and parse RefSeq organelle collections."""
    parsed = []
    if isinstance(collections, tuple):
        for collection in collections:
            listing = refseq_listing(collection)
            parsed += parse_listing(listing, collection, opts)
    else:
        listing = refseq_listing(collections)
        parsed += parse_listing(listing, collections, opts)
    # parsed = parse_flatfile(
    #     "mitochondrion.2.genomic.gbff.gz",
    #     "mitochondrion",
    #     opts,
    # )
    return parsed


def metricDates(obj):
    """Add date fields for assemblies with sufficient metrics."""
    if "contigN50" in obj and "scaffoldN50" in obj:
        contig_n50 = obj.get("contigN50", 0)
        scaffold_n50 = obj.get("scaffoldN50", 0)
        if contig_n50 > 1000000 and scaffold_n50 > 10000000:
            obj["ebpMetricDate"] = obj["submissionDate"]


def parse_ncbi_datasets_record(record, parsed):
    """Parse a single NCBI datasets record."""
    obj = {}
    for key in ("taxId", "organismName", "commonName", "isolate", "sex"):
        obj[key] = record.get(key, "None")
    assemblyInfo = record.get("assemblyInfo", {})
    for key in (
        "assemblyLevel",
        "assemblyName",
        "assemblyType",
        "biosampleAccession",
        "genbankAssmAccession",
        "refseqAssmAccession",
        "refseqCategory",
        "submissionDate",
        "submitter",
    ):
        obj[key] = assemblyInfo.get(key, None)
        if key == "refseqCategory":
            if obj[key] == "representative genome":
                obj["primaryValue"] = 1
            else:
                obj["primaryValue"] = None
    if obj["refseqAssmAccession"] == "na":
        obj["refseqAssmAccession"] = None
        obj["refseqCategory"] = None
        obj["primaryValue"] = None
    annotationInfo = record.get("annotationInfo", {})
    if annotationInfo:
        annot = {}
        for key in ("name", "releaseDate", "reportUrl", "source"):
            annot["annotation%s" % key.capitalize()] = annotationInfo.get(key, None)
        if annot and "stats" in annotationInfo:
            geneCounts = annotationInfo["stats"].get("geneCounts", None)
            for key in ("nonCoding", "proteinCoding", "pseudogene", "total"):
                annot["geneCount%s" % key.capitalize()] = geneCounts.get(key, None)
            if obj["genbankAssmAccession"] in parsed:
                parsed[obj["genbankAssmAccession"]].update(annot)
                return
            obj.update(annot)
    bioprojects = []
    for lineage in assemblyInfo.get("bioprojectLineage", []):
        for bioproject in lineage["bioprojects"]:
            bioprojects.append(bioproject["accession"])
    obj["bioProjectAccession"] = ";".join(bioprojects) if bioprojects else None
    assemblyStats = record.get("assemblyStats", {})
    obj.update(assemblyStats)
    metricDates(obj)
    wgsInfo = record.get("wgsInfo", {})
    for key in ("masterWgsUrl", "wgsContigsUrl", "wgsProjectAccession"):
        obj[key] = wgsInfo.get(key, None)
    parsed[obj["genbankAssmAccession"]] = obj


def parse_ncbi_datasets_sample(record, parsed):
    """Parse sample information from a single NCBI datasets record."""
    obj = {}
    for key in ("taxId", "isolate", "sex"):
        obj[key] = record.get(key, "None")
    assemblyInfo = record.get("assemblyInfo", {})
    for key in (
        "assemblyLevel",
        "biosampleAccession",
        "genbankAssmAccession",
        "refseqAssmAccession",
        "refseqCategory",
        "submitter",
    ):
        obj[key] = assemblyInfo.get(key, None)
        if key == "refseqCategory":
            if obj[key] == "representative genome":
                obj["primaryValue"] = 1
            else:
                obj["primaryValue"] = None
    attributes = {entry["name"]: entry.get("value", None) for entry in assemblyInfo.get("biosample", {}).get("attributes", [])}
    for key in ("estimated_size", "geo_loc_name", "num_replicons", "ploidy"):
        obj[key] = attributes.get(key, None)
    obj["latitude"] = degrees_to_decimal(attributes.get("geographic location (latitude)", None))
    obj["longitude"] = degrees_to_decimal(attributes.get("geographic location (longitude)", None))
    obj["elevation"] = attributes.get("geographic location (elevation)", None)
    bioprojects = []
    for lineage in assemblyInfo.get("bioprojectLineage", []):
        for bioproject in lineage["bioprojects"]:
            bioprojects.append(bioproject["accession"])
    obj["bioProjectAccession"] = ";".join(bioprojects) if bioprojects else None
    parsed[obj["biosampleAccession"]] = obj


def ncbi_genome_parser(params, opts, *, types=None, names=None):
    """Parse NCBI Datasets genome report."""
    parsed = {}
    with tofile.open_file_handle(
        "%s/ncbi_dataset/data/assembly_data_report.jsonl" % opts["ncbi-datasets-%s" % params]
    ) as report:
        for line in report:
            record = ujson.loads(line)
            if params == "sample":
                parse_ncbi_datasets_sample(record, parsed)
            else:
                parse_ncbi_datasets_record(record, parsed)
    return [value for value in parsed.values()]
