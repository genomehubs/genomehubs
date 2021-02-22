#!/usr/bin/env python3

"""
Index a file, directory or repository.

Usage:
    genomehubs index [--hub-name STRING] [--hub-path PATH] [--hub-version PATH]
                     [--config-file PATH...] [--config-save PATH]
                     [--es-host URL...] [--assembly-dir PATH]
                     [--assembly-repo URL] [--assembly-exception PATH]
                     [--taxon-dir PATH] [--taxon-repo URL] [--taxon-exception PATH]
                     [--taxon-lookup STRING] [--file PATH...] [file-dir PATH...]
                     [--remote-file URL...] [--remote-file-dir URL...]
                     [--taxon-id STRING] [--assembly-id STRING] [--analysis-id STRING]
                     [--file-title STRING] [--file-description STRING] [--file-metadata PATH]
                     [-h|--help] [-v|--version]

Options:
    --hub-name STRING          GenomeHubs instance name.
    --hub-path PATH            GenomeHubs instance root directory path.
    --hub-version STR          GenomeHubs instance version string.
    --config-file PATH         Path to YAML file containing configuration options.
    --config-save PATH         Path to write configuration options to YAML file.
    --es-host URL              ElasticSearch hostname/URL and port.
    --assembly-dir PATH        Path to directory containing assembly-level data.
    --assembly-repo URL        Remote git repository containing assembly-level data.
                               Optionally include `~branch-name` suffix.
    --assembly-exception PATH  Path to directory to write assembly data that failed to import.
    --taxon-lookup STRING      Taxon name class to lookup (scientific|all). [Default: scientific]
    --taxon-dir PATH           Path to directory containing taxon-level data.
    --taxon-repo URL           Remote git repository containing taxon-level data.
                               Optionally include `~branch-name` suffix.
    --taxon-exception PATH     Path to directory to write taxon data that failed to import.
    --file PATH                Path to file for generic file import.
    --file-dir PATH            Path to directory containing generic files to import.
    --remote-file URL          Location of remote file for generic file import.
    --remote-file-dir URL      Location of remote directory containing generic files to import.
    --taxon-id STRING          Taxon ID to index files against.
    --assembly-id STRING       Assembly ID to index files against.
    --analysis-id STRING       Analysis ID to index files against.
    --file-title STRING        Default title for indexed files.
    --file-description STRING  Default description for all indexed files.
    --file-metadata PATH       CSV, TSV, YAML or JSON file metadata with one entry per file to be indexed.
    -h, --help                 Show this
    -v, --version              Show version number

Examples:
    # 1. Index all files in a remote repository
    ./genomehubs index --taxon-repo https://github.com/example/repo~main
"""

import csv
import sys
from collections import defaultdict
from pathlib import Path

from docopt import docopt
from tolkein import tolog
from tqdm import tqdm

from ..lib import assembly
from ..lib import es_functions
from ..lib import hub
from ..lib import taxon
from .assembly import add_identifiers_and_attributes_to_assemblies
from .attributes import index_types
from .config import config
from .es_functions import index_stream
from .files import index_files
from .files import index_metadata
from .hub import process_row
from .hub import set_column_indices
from .hub import validate_types_file
from .taxon import add_names_and_attributes_to_taxa
from .taxon import fix_missing_ids
from .version import __version__

LOGGER = tolog.logger(__name__)


def index_file(es, types, data, opts):
    """Index a file."""
    delimiters = {"csv": ",", "tsv": "\t"}
    rows = csv.reader(
        data, delimiter=delimiters[types["file"]["format"]], quotechar='"'
    )
    header = None
    if types["file"].get("header", False):
        header = next(rows)
        set_column_indices(types, header)
    with_ids = defaultdict(list)
    taxon_asm_data = defaultdict(list)
    without_ids = defaultdict(list)
    failed_rows = defaultdict(list)
    blanks = set(["", "NA", "N/A", "None"])
    taxon_types = {}
    for taxonomy_name in opts["taxonomy-source"]:
        taxon_template = taxon.index_template(taxonomy_name, opts)
        LOGGER.info("Processing rows")
        for row in tqdm(rows):
            try:
                processed_data, taxon_data, new_taxon_types = process_row(types, row)
            except Exception:
                failed_rows["None"].append(row)
                continue
            taxon_types.update(new_taxon_types)
            if (
                "taxon_id" in processed_data["taxonomy"]
                and processed_data["taxonomy"]["taxon_id"] not in blanks
            ):
                with_ids[processed_data["taxonomy"]["taxon_id"]].append(processed_data)
                taxon_asm_data[processed_data["taxonomy"]["taxon_id"]].append(
                    taxon_data
                )
            else:
                if "taxonomy" in types and "alt_taxon_id" in types["taxonomy"]:
                    without_ids[processed_data["taxonomy"]["alt_taxon_id"]].append(
                        processed_data
                    )
                    taxon_asm_data[processed_data["taxonomy"]["alt_taxon_id"]].append(
                        taxon_data
                    )
                    failed_rows[processed_data["taxonomy"]["alt_taxon_id"]].append(row)
                elif "subspecies" in processed_data["taxonomy"]:
                    without_ids[processed_data["taxonomy"]["subspecies"]].append(
                        processed_data
                    )
                    taxon_asm_data[processed_data["taxonomy"]["subspecies"]].append(
                        taxon_data
                    )
                    failed_rows[processed_data["taxonomy"]["subspecies"]].append(row)
                elif "species" in processed_data["taxonomy"]:
                    without_ids[processed_data["taxonomy"]["species"]].append(
                        processed_data
                    )
                    taxon_asm_data[processed_data["taxonomy"]["species"]].append(
                        taxon_data
                    )
                    failed_rows[processed_data["taxonomy"]["species"]].append(row)
                else:
                    failed_rows["None"].append(row)
        LOGGER.info("Found taxon IDs in %d entries", len(with_ids.keys()))
        create_ids, without_ids = fix_missing_ids(
            es,
            opts,
            without_ids,
            types=types,
            taxon_template=taxon_template,
            failed_rows=failed_rows,
            with_ids=with_ids,
            blanks=blanks,
            header=header,
        )
        if with_ids or create_ids:
            LOGGER.info("Indexing %d entries", len(with_ids.keys()))
            if opts["index"] == "taxon":
                docs = add_names_and_attributes_to_taxa(
                    es, dict(with_ids), opts, template=taxon_template, blanks=blanks
                )
                index_stream(
                    es, taxon_template["index_name"], docs, _op_type="update",
                )
            elif opts["index"] == "assembly":
                assembly_template = assembly.index_template(taxonomy_name, opts)
                docs = add_identifiers_and_attributes_to_assemblies(
                    es,
                    with_ids,
                    opts,
                    template=assembly_template,
                    taxon_template=taxon_template,
                    blanks=blanks,
                )
                index_stream(es, assembly_template["index_name"], docs)
                # index taxon-level attributes
                index_types(
                    es, "taxon", {"attributes": taxon_types}, opts,
                )
                taxon_asm_with_ids = {
                    taxon_id: taxon_asm_data[taxon_id] for taxon_id in with_ids.keys()
                }
                taxon_docs = add_names_and_attributes_to_taxa(
                    es, taxon_asm_with_ids, opts, template=taxon_template, blanks=blanks
                )
                index_stream(
                    es, taxon_template["index_name"], taxon_docs, _op_type="update",
                )


def main(args):
    """Index files."""
    options = config("index", **args)

    # Start Elasticsearch
    es = es_functions.launch_es(options["fill"])

    # Post search scripts
    with tolog.DisableLogger():
        hub.post_search_scripts(es)

    for index in list(["taxon", "assembly"]):
        data_dir = "%s-dir" % index
        if data_dir in options["index"]:
            dir_path = options["index"][data_dir]
            for types_file in sorted(Path(dir_path).glob("*.names.yaml")):
                types, data = validate_types_file(types_file, dir_path)
                LOGGER.info("Indexing %s" % types["file"]["name"])
                index_types(es, index, types, options["index"])
                index_file(
                    es,
                    types,
                    data,
                    {**options["index"], "index": index, "index_types": index_types},
                )
            for types_file in sorted(Path(dir_path).glob("*.types.yaml")):
                types, data = validate_types_file(types_file, dir_path)
                LOGGER.info("Indexing %s" % types["file"]["name"])
                index_types(es, index, types, options["index"])
                index_file(
                    es,
                    types,
                    data,
                    {**options["index"], "index": index, "index_types": index_types},
                )
    # TODO: #29 Implement alternate backbone taxonomies
    taxonomy_name = options["index"]["taxonomy-source"][0]
    if "file" in options["index"]:
        index_files(es, options["index"]["file"], taxonomy_name, options["index"])
    elif "file-metadata" in options["index"]:
        index_metadata(
            es, options["index"]["file-metadata"], taxonomy_name, options["index"]
        )


def cli():
    """Entry point."""
    if len(sys.argv) == sys.argv.index("index") + 1:
        args = docopt(__doc__, argv=[])
    else:
        args = docopt(__doc__, version=__version__)
    main(args)


if __name__ == "__main__":
    cli()
