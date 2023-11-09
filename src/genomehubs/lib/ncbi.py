#!/usr/bin/env python3
"""NCBI functions."""

import contextlib
import csv
import gzip
import os
import re
from collections import Counter
from collections import defaultdict
from itertools import groupby
from operator import itemgetter
from urllib.error import ContentTooShortError

import xml.etree.ElementTree as ET

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
    url = f"{REFSEQ_FTP}/{collection}"
    for _ in range(5):
        with contextlib.suppress(ContentTooShortError):
            html = tofetch.fetch_url(url)
            break
    listing = []
    for line in html.split("\n"):
        if match := pattern.search(line):
            listing.append(f"{url}/{match.group()}")
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
            fields["source_year"] = submitted_year.search(reference.journal)[1]
        elif "source_author" in fields:
            continue
        else:
            fields["source_year"] = published_year.search(reference.journal)[1]
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
            with contextlib.suppress(ValueError):
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
    return f"{parts[2]}-{months[parts[1]]}-{parts[0].zfill(2)}"


def parse_flatfile(flatfile, organelle, opts):
    """Parse a GenBank flatfile."""
    data = []
    comment_re = re.compile(
        r"(?:derived|identical)\s(?:from|to)\s([\w\d]+).*COMPLETENESS: full length",
        re.DOTALL,
    )
    with gzip.open(flatfile, "rt") as fh:
        gb = SeqIO.parse(fh, "gb")
        for entry in tqdm(gb, mininterval=int(opts.get("log-interval", 1))):
            if (
                "refseq-root" in opts
                and opts["refseq-root"] not in entry.annotations["taxonomy"]
            ):
                continue
            fields = {"organelle": organelle}
            if entry.annotations["comment"]:
                if match := comment_re.search(entry.annotations["comment"]):
                    fields["genbank_accession"] = match[1]
                else:
                    continue
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
    if "contigN50" in obj and "scaffoldN50" in obj and "assemblyLevel" in obj:
        contig_n50 = obj.get("contigN50", 0)
        scaffold_n50 = obj.get("scaffoldN50", 0)
        assembly_level = obj.get("assemblyLevel", "Contig")
        if (
            contig_n50 > 1000000
            and scaffold_n50 > 10000000
            and assembly_level in ["Chromosome", "Complete Genome"]
        ):
            obj["ebpMetricDate"] = obj["releaseDate"]


def get_biosample_attributes(biosample):
    """Extract attributes from a biosample."""
    obj = {}
    attributes = biosample.get("attributes", [])
    for entry in attributes:
        try:
            if entry["value"].lower().startswith("not "):
                continue
            obj[entry["name"]] = entry["value"]
        except KeyError:
            continue
    return obj


def parse_ncbi_datasets_record(record, parsed):
    """Parse a single NCBI datasets record."""
    organism = record.get("organism", {})
    obj = {
        key: organism.get(key, "None")
        for key in ("taxId", "organismName", "commonName")
    }

    obj["genbankAssmAccession"] = record["accession"]
    if "pairedAccession" in record:
        if record["pairedAccession"].startswith("GCF_"):
            obj["refseqAssmAccession"] = record["pairedAccession"]
        else:
            obj["refseqAssmAccession"] = record["accession"]
            obj["genbankAssmAccession"] = record["pairedAccession"]
    assemblyInfo = record.get("assemblyInfo", {})
    annotationInfo = record.get("annotationInfo", {})
    if assemblyInfo.get("atypical", False):
        return
    for key in (
        "assemblyLevel",  #
        "assemblyName",  #
        "assemblyType",  #
        # "biosampleAccession",  # biosample.accession
        # "pairedAccession",  # refseqAssmAccession
        "refseqCategory",  #
        "releaseDate",  # submissionDate
        "submitter",  #
    ):
        obj[key] = assemblyInfo.get(key, annotationInfo.get(key, "None"))
    if "refseqAssmAccession" not in obj or obj["refseqAssmAccession"] == "na":
        obj["refseqAssmAccession"] = "None"
    elif obj["refseqCategory"] != "None":
        obj["primaryValue"] = 1
    if annotationInfo:
        annot = {
            f"annotation{key.capitalize()}": annotationInfo.get(key, "None")
            for key in ("name", "releaseDate", "reportUrl", "source")  # sourceDatabase
        }

        if annot and "stats" in annotationInfo:
            geneCounts = annotationInfo["stats"].get("geneCounts", "None")
            for key in ("nonCoding", "proteinCoding", "pseudogene", "total"):
                annot[f"geneCount{key.capitalize()}"] = geneCounts.get(key, "None")
            obj.update(annot)
    bioprojects = []
    for lineage in assemblyInfo.get("bioprojectLineage", []):
        if "bioprojects" in lineage:
            bioprojects.extend(
                bioproject["accession"] for bioproject in lineage["bioprojects"]
            )

    if not bioprojects and "bioprojects" in assemblyInfo.get("biosample", {}):
        bioprojects.extend(
            bioproject["accession"]
            for bioproject in assemblyInfo["biosample"]["bioprojects"]
        )

    obj["bioProjectAccession"] = ";".join(bioprojects) if bioprojects else "None"
    biosample = assemblyInfo.get("biosample", {})
    obj["biosampleAccession"] = biosample.get("accession", "None")
    biosampleAttributes = get_biosample_attributes(biosample)
    for key in ("isolate", "sex"):
        obj[key] = biosampleAttributes.get(key, "None")
    assemblyStats = record.get("assemblyStats", {})
    obj.update(assemblyStats)
    metricDates(obj)
    wgsInfo = record.get("wgsInfo", {})
    for key in ("masterWgsUrl", "wgsContigsUrl", "wgsProjectAccession"):
        obj[key] = wgsInfo.get(key, "None")
    if obj.get("genbankAssmAccession", "None") in parsed:
        for key, value in obj.items():
            if value != "None":
                parsed[obj["genbankAssmAccession"]][key] = value
    elif obj["genbankAssmAccession"].startswith("GCA_"):
        parsed[obj["genbankAssmAccession"]] = obj


def parse_ncbi_datasets_sample(record, parsed):
    """Parse sample information from a single NCBI datasets record."""
    organism = record.get("organism", {})
    obj = {
        key: organism.get(key, "None")
        for key in ("taxId", "organismName", "commonName", "infraspecificNames")
    }
    if obj["infraspecificNames"] != "None":
        for key in ("sex", "isolate"):
            obj[key] = obj["infraspecificNames"].get(key, "None")
    del obj["infraspecificNames"]
    obj["genbankAssmAccession"] = record["accession"]
    if "pairedAccession" in record:
        if record["pairedAccession"].startswith("GCF_"):
            obj["refseqAssmAccession"] = record["pairedAccession"]
        else:
            obj["refseqAssmAccession"] = record["accession"]
            obj["genbankAssmAccession"] = record["pairedAccession"]
    assemblyInfo = record.get("assemblyInfo", {})
    annotationInfo = record.get("annotationInfo", {})
    if assemblyInfo.get("atypical", False):
        return

    for key in (
        "assemblyLevel",
        "refseqCategory",
        "submitter",
    ):
        obj[key] = assemblyInfo.get(key, annotationInfo.get(key, "None"))
    if "refseqAssmAccession" not in obj or obj["refseqAssmAccession"] == "na":
        obj["refseqAssmAccession"] = "None"
    elif obj["refseqCategory"] != "None":
        obj["primaryValue"] = 1
    bioprojects = []
    for lineage in assemblyInfo.get("bioprojectLineage", []):
        if "bioprojects" in lineage:
            bioprojects.extend(
                bioproject["accession"] for bioproject in lineage["bioprojects"]
            )

    if not bioprojects and "bioprojects" in assemblyInfo.get("biosample", {}):
        bioprojects.extend(
            bioproject["accession"]
            for bioproject in assemblyInfo["biosample"]["bioprojects"]
        )

    obj["bioProjectAccession"] = ";".join(bioprojects) if bioprojects else "None"
    biosample = assemblyInfo.get("biosample", {})
    obj["biosampleAccession"] = biosample.get("accession", "None")
    biosampleAttributes = get_biosample_attributes(biosample)

    biosampleAttributes = {
        entry["name"]: entry.get("value", "None")
        for entry in biosample.get("attributes", [])
    }
    for key in ("estimated_size", "geo_loc_name", "num_replicons", "ploidy"):
        obj[key] = biosampleAttributes.get(key)
    obj["latitude"] = degrees_to_decimal(
        biosampleAttributes.get("geographic location (latitude)")
    )
    obj["longitude"] = degrees_to_decimal(
        biosampleAttributes.get("geographic location (longitude)")
    )
    obj["elevation"] = biosampleAttributes.get("geographic location (elevation)")
    parsed[obj["biosampleAccession"]] = obj


def ncbi_genome_parser(params, opts, *, types=None, names=None):
    """Parse NCBI Datasets genome report."""
    parsed = {}
    jsonl = opts[f"ncbi-datasets-{params}"]
    if not jsonl.endswith(".jsonl"):
        jsonl = f"{jsonl}/ncbi_dataset/data/assembly_data_report.jsonl"
    with tofile.open_file_handle(jsonl) as report:
        for line in report:
            record = ujson.loads(line)
            if params == "sample":
                parse_ncbi_datasets_sample(record, parsed)
            else:
                parse_ncbi_datasets_record(record, parsed)
    return list(parsed.values())


def split_chunks(values, split_val):
    """Split a list of values into chunks at a certain value."""
    index = 0

    def chunk_index(val):
        nonlocal index
        if val == split_val:
            index += 1
        return index

    return groupby(values, chunk_index)


def read_exp_xml(node, obj):
    """Read values from ExpXml section."""
    for child in node:
        tag = child.tag
        if tag == "Bioproject":
            obj["bioproject"] = child.text
        elif tag == "Biosample":
            obj["biosample"] = child.text
        elif tag == "Organism":
            obj["taxon_id"] = child.get("taxid")
        elif tag == "Experiment":
            obj["sra_accession"] = child.get("acc")
        elif tag == "Summary":
            obj["platform"] = child.findtext("Platform")
        elif tag == "Library_descriptor":
            obj["library_source"] = child.findtext("LIBRARY_SOURCE").lower()


def read_runs(node, obj):
    """Read values from Runs section."""
    if "runs" not in obj:
        obj["runs"] = []
    for child in node:
        obj["runs"].append(
            {"accession": child.get("acc"), "reads": child.get("total_spots")}
        )


def parse_sra_xml(xml_file):
    """Parse an SRA xml file."""
    rows = []
    with open(xml_file, "r", encoding="utf8") as container_file:
        for doc_num, doc in split_chunks(
            container_file, '<?xml version="1.0" encoding="UTF-8" ?>\n'
        ):
            print(f"processing sub-document #{doc_num}")
            print(len(rows))
            lines = list(doc)
            try:
                root = ET.fromstringlist(lines)
            except Exception:
                continue
            for doc_summary in root.iter("DocumentSummary"):
                obj = {}
                for child in doc_summary:
                    tag = child.tag
                    if tag == "CreateDate":
                        obj["date"] = child.text
                    elif tag == "ExpXml":
                        read_exp_xml(child, obj)
                    elif tag == "Runs":
                        read_runs(child, obj)
                    continue
                rows.append(obj)
    return rows


def group_by_taxon(rows, grouped=None):
    """
    Group SRA runs by taxon.

    Keep the most recent 10 rows only.
    """
    if grouped is None:
        grouped = defaultdict(lambda: {"count": 0, "reads": 0, "runs": []})
    for obj in sorted(rows, key=itemgetter("date")):
        try:
            taxon_id = obj["taxon_id"]
        except Exception:
            continue
        for run in obj["runs"]:
            try:
                row = {
                    **obj,
                    "run_accession": run["accession"],
                    "reads": int(run["reads"]),
                }
            except Exception:
                continue
            row.pop("runs")
            grouped[taxon_id]["runs"].insert(0, row)
            grouped[taxon_id]["count"] += 1
            grouped[taxon_id]["reads"] += row["reads"]
            if len(grouped[taxon_id]["runs"]) > 10:
                grouped[taxon_id]["runs"].pop()
    rows = [
        {
            "taxon_id": taxon_id,
            "sra_accession": ";".join([item["sra_accession"] for item in obj["runs"]]),
            "run_accession": ";".join([item["run_accession"] for item in obj["runs"]]),
            "library_source": ";".join(
                [item["library_source"] for item in obj["runs"]]
            ),
            "platform": ";".join([item["platform"] for item in obj["runs"]]),
            "reads": ";".join([str(item["reads"]) for item in obj["runs"]]),
            "total_reads": obj["reads"],
            "total_runs": obj["count"],
        }
        for taxon_id, obj in grouped.items()
    ]
    return rows


def load_tsv(file):
    """Load rows from a TSV file."""
    grouped = defaultdict(lambda: {"count": 0, "reads": 0, "runs": []})
    with open(file, newline="") as tsv_file:
        reader = csv.DictReader(tsv_file, delimiter="\t")
        for row in reader:
            taxon_id = row["taxon_id"]
            total_runs = row["total_runs"]
            total_reads = row["total_reads"]
            grouped[taxon_id]["count"] = int(total_runs)
            grouped[taxon_id]["reads"] = int(total_reads)
            for key in (
                "run_accession",
                "sra_accession",
                "library_source",
                "platform",
                "reads",
            ):
                row[key] = row[key].split(";")
            for index, run_accession in enumerate(row["run_accession"]):
                grouped[taxon_id]["runs"].append(
                    {
                        "run_accession": run_accession,
                        "sra_accession": row["sra_accession"][index],
                        "library_source": row["library_source"][index],
                        "platform": row["platform"][index],
                        "reads": int(row["reads"][index]),
                    }
                )
    return grouped


def sra_parser(params, opts, *, types=None, names=None):
    """Parse SRA efetch xml."""
    outfile = opts["outfile"]
    # Load older runs from tsv
    previous = load_tsv(outfile) if os.path.isfile(outfile) else None
    xml_file = opts["sra"]
    # Load newer runs from xml
    rows = parse_sra_xml(xml_file)
    return group_by_taxon(rows, grouped=previous)
