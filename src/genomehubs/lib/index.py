#!/usr/bin/env python3

"""
Index a file, directory or repository.

Usage:
    genomehubs index [--hub-name STRING] [--hub-path PATH] [--hub-version PATH]
                     [--config-file PATH...] [--config-save PATH]
                     [--es-host URL...] [--assembly-dir PATH]
                     [--assembly-repo URL] [--assembly-exception PATH]
                     [--taxon-dir PATH] [--taxon-repo URL] [--taxon-exception PATH]
                     [--taxon-lookup STRING] [--taxon-lookup-root STRING]
                     [--taxon-lookup-in-memory] [--taxon-id-as-xref STRING]
                     [--taxon-spellcheck] [--taxonomy-source STRING]
                     [--file PATH...] [file-dir PATH...]
                     [--remote-file URL...] [--remote-file-dir URL...]
                     [--taxon-id STRING] [--assembly-id STRING] [--analysis-id STRING]
                     [--file-title STRING] [--file-description STRING] [--file-metadata PATH]
                     [--dry-run]
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
    --taxon-lookup-root STRING Root taxon Id for in-memory lookup.
    --taxon-lookup STRING      Taxon name class to lookup (scientific|any). [Default: scientific]
    --taxon-lookup-in-memory   Flag to use in-memory taxon name lookup.
    --taxon-id-as-xref STRING  Set source DB name to treat taxon_id in file as xref.
    --taxon-spellcheck         Flag to use fuzzy matching to match taxon names.
    --taxon-dir PATH           Path to directory containing taxon-level data.
    --taxon-repo URL           Remote git repository containing taxon-level data.
                               Optionally include `~branch-name` suffix.
    --taxon-exception PATH     Path to directory to write taxon data that failed to import.
    --taxonomy-source STRING   Name of taxonomy to use (ncbi or ott).
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
    --dry-run                  Flag to run without loading data into the elasticsearch index.
    -h, --help                 Show this
    -v, --version              Show version number

Examples:
    # 1. Index all files in a remote repository
    ./genomehubs index --taxon-repo https://github.com/genomehubs/goat-data
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
from .hub import strip_comments
from .hub import write_imported_rows
from .hub import write_imported_taxa
from .hub import write_spellchecked_taxa
from .taxon import add_names_and_attributes_to_taxa
from .taxon import fix_missing_ids
from .taxon import load_taxon_table
from .taxon import translate_xrefs
from .validate import validate_types_file
from .version import __version__

LOGGER = tolog.logger(__name__)


def not_blank(key, obj, blanks):
    """Test value is not blank."""
    return key in obj and obj[key] and obj[key] not in blanks


def summarise_imported_taxa(docs, imported_taxa):
    """Summarise taxon imformation from a stram of taxon docs."""
    for entry_id, entry in docs:
        imported_taxa[entry["scientific_name"]].append(
            {
                "taxon_id": entry["taxon_id"],
                "rank": entry["taxon_rank"],
            }
        )
        yield entry_id, entry


def group_rows(
    taxon_id,
    rows,
    with_ids,
    without_ids,
    taxon_asm_data,
    imported_rows,
    types,
    failed_rows,
    blanks,
):
    """Group processed rows by available taxon info for import."""
    ranks = ["subspecies", "species", "family", "order", "class"]
    for processed_data, taxon_data, row in rows:
        if taxon_id != "other":
            with_ids[taxon_id].append(processed_data)
            taxon_asm_data[taxon_id].append(taxon_data)
            imported_rows.append(row)

        else:
            if "taxonomy" in types and not_blank(
                "alt_taxon_id", processed_data["taxonomy"], blanks
            ):
                without_ids[processed_data["taxonomy"]["alt_taxon_id"]].append(
                    processed_data
                )
                taxon_asm_data[processed_data["taxonomy"]["alt_taxon_id"]].append(
                    taxon_data
                )
                failed_rows[processed_data["taxonomy"]["alt_taxon_id"]].append(row)
            else:
                row_rank = None
                for rank in ranks:
                    if not_blank(rank, processed_data["taxonomy"], blanks):
                        row_rank = rank
                        without_ids[processed_data["taxonomy"][rank]].append(
                            processed_data
                        )
                        taxon_asm_data[processed_data["taxonomy"][rank]].append(
                            taxon_data
                        )
                        failed_rows[processed_data["taxonomy"][rank]].append(row)
                        break
                if row_rank is None:
                    failed_rows["None"].append(row)


def index_file(es, types, names, data, opts, *, taxon_table=None):
    """Index a file."""
    delimiters = {"csv": ",", "tsv": "\t"}
    rows = csv.reader(
        strip_comments(data, types),
        delimiter=delimiters[types["file"]["format"]],
        quotechar='"',
    )
    if "header" in types["file"] and types["file"]["header"]:
        header = next(rows)
        set_column_indices(types, header)
    else:
        header = None
    with_ids = defaultdict(list)
    taxon_asm_data = defaultdict(list)
    without_ids = defaultdict(list)
    failed_rows = defaultdict(list)
    imported_rows = []
    blanks = set(["", "NA", "N/A", "None"])
    taxon_types = {}
    taxonomy_name = opts["taxonomy-source"].lower()
    taxon_template = taxon.index_template(taxonomy_name, opts)
    LOGGER.info("Processing rows")
    processed_rows = defaultdict(list)
    for row in tqdm(rows):
        try:
            processed_data, taxon_data, new_taxon_types = process_row(types, names, row)
        except Exception as err:
            print(err)
            failed_rows["None"].append(row)
            continue
        taxon_types.update(new_taxon_types)
        if not_blank("_taxon_id", processed_data["taxonomy"], blanks):
            # if opts["taxon-id-as-xref"]:
            with_ids[processed_data["taxonomy"]["_taxon_id"]].append(processed_data)
            taxon_asm_data[processed_data["taxonomy"]["_taxon_id"]].append(taxon_data)
            imported_rows.append(row)
        else:
            tmp_taxon_id = "other"
            if not_blank("taxon_id", processed_data["taxonomy"], blanks):
                tmp_taxon_id = processed_data["taxonomy"]["taxon_id"]
            processed_rows[tmp_taxon_id].append((processed_data, taxon_data, row))
    # check for taxon-id-as-xref here and do lookup if required
    if "taxon-id-as-xref" in opts:
        id_map = translate_xrefs(
            es,
            index=taxon_template["index_name"],
            xrefs=list(processed_rows.keys()),
            source=opts["taxon-id-as-xref"],
        )
        updated_rows = defaultdict(list)
        for xref, taxon_id in id_map.items():
            updated_rows[taxon_id] = processed_rows[xref]
            del processed_rows[xref]
        unmatched = list(processed_rows.keys())
        for xref in unmatched:
            updated_rows["other"] += processed_rows[xref]
            del processed_rows[xref]
    else:
        updated_rows = processed_rows
    for taxon_id, rows in updated_rows.items():
        group_rows(
            taxon_id,
            rows,
            with_ids,
            without_ids,
            taxon_asm_data,
            imported_rows,
            types,
            failed_rows,
            blanks,
        )
    LOGGER.info("Found taxon IDs in %d entries", len(with_ids.keys()))
    spellings = {"spellcheck": {}, "synonym": {}}
    create_ids, without_ids = fix_missing_ids(
        es,
        opts,
        without_ids,
        types=types,
        taxon_template=taxon_template,
        failed_rows=failed_rows,
        imported_rows=imported_rows,
        with_ids=with_ids,
        blanks=blanks,
        header=header,
        spellings=spellings,
        taxon_table=taxon_table,
    )
    write_spellchecked_taxa(spellings, opts, types=types)
    if with_ids or create_ids:
        write_imported_rows(
            imported_rows, opts, types=types, header=header, label="imported"
        )
        LOGGER.info("Indexing %d entries", len(with_ids.keys()))
        if opts["index"] == "taxon":
            docs = add_names_and_attributes_to_taxa(
                es, dict(with_ids), opts, template=taxon_template, blanks=blanks
            )
            imported_taxa = defaultdict(list)
            index_stream(
                es,
                taxon_template["index_name"],
                summarise_imported_taxa(docs, imported_taxa),
                _op_type="update",
                dry_run=opts.get("dry-run", False),
            )
            write_imported_taxa(imported_taxa, opts, types=types)
        elif opts["index"] == "assembly":
            # TODO: keep track of taxon_id not found exceptions
            assembly_template = assembly.index_template(taxonomy_name, opts)
            docs = add_identifiers_and_attributes_to_assemblies(
                es,
                with_ids,
                opts,
                template=assembly_template,
                taxon_template=taxon_template,
                blanks=blanks,
            )
            index_stream(
                es,
                assembly_template["index_name"],
                docs,
                dry_run=opts.get("dry-run", False),
            )
            # index taxon-level attributes
            index_types(
                es,
                "taxon",
                {"attributes": taxon_types},
                opts,
                dry_run=opts.get("dry-run", False),
            )
            taxon_asm_with_ids = {
                taxon_id: taxon_asm_data[taxon_id] for taxon_id in with_ids.keys()
            }
            # print(taxon_asm_with_ids)
            taxon_docs = add_names_and_attributes_to_taxa(
                es,
                taxon_asm_with_ids,
                opts,
                template=taxon_template,
                blanks=blanks,
            )
            index_stream(
                es,
                taxon_template["index_name"],
                taxon_docs,
                _op_type="update",
                dry_run=opts.get("dry-run", False),
            )


def main(args):
    """Index files."""
    options = config("index", **args)

    # Start Elasticsearch
    es = es_functions.launch_es(options["fill"])

    # Post search scripts
    with tolog.DisableLogger():
        hub.post_search_scripts(es)

    taxonomy_name = options["index"]["taxonomy-source"].lower()
    taxon_table = None
    if taxon_table is None and "taxon-lookup-in-memory" in options["index"]:
        taxon_table = {
            "scientific": defaultdict(list),
            "any": defaultdict(list),
        }
        load_taxon_table(es, options["index"], taxonomy_name, taxon_table)
    dry_run = options["index"].get("dry-run", False)
    for index in list(["taxon", "assembly"]):
        data_dir = "%s-dir" % index
        if data_dir in options["index"]:
            dir_path = options["index"][data_dir]
            for types_file in sorted(Path(dir_path).glob("*.names.yaml")):
                types, data, names = validate_types_file(
                    types_file, dir_path, es, index, options["index"]
                )
                LOGGER.info("Indexing %s" % types["file"]["name"])
                index_types(es, index, types, options["index"], dry_run=dry_run)
                index_file(
                    es,
                    types,
                    names,
                    data,
                    {
                        **options["index"],
                        "index": index,
                        "index_types": index_types,
                    },
                    taxon_table=taxon_table,
                )
            for types_file in sorted(Path(dir_path).glob("*.types.yaml")):
                types, data, names = validate_types_file(
                    types_file, dir_path, es, index, options["index"]
                )
                LOGGER.info("Indexing types")
                index_types(es, index, types, options["index"], dry_run=dry_run)
                if "file" in types and "name" in types["file"]:
                    LOGGER.info("Indexing %s" % types["file"]["name"])
                    index_file(
                        es,
                        types,
                        names,
                        data,
                        {
                            **options["index"],
                            "index": index,
                            "index_types": index_types,
                        },
                        taxon_table=taxon_table,
                    )
    # TODO: #29 Implement alternate backbone taxonomies
    if "file" in options["index"]:
        index_files(es, options["index"]["file"], taxonomy_name, options["index"])
    elif "file-metadata" in options["index"]:
        index_metadata(
            es,
            options["index"]["file-metadata"],
            taxonomy_name,
            options["index"],
            dry_run=dry_run,
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
