#!/usr/bin/env python3

"""
Index a file, directory or repository.

Usage:
    genomehubs index [--hub-name STRING] [--hub-path PATH] [--hub-version PATH]
                     [--config-file PATH...] [--config-save PATH]
                     [--es-host URL...] [--assembly-dir PATH]
                     [--feature-dir PATH] [--sample-dir PATH]
                     [--taxon-dir PATH] [--taxon-repo URL] [--taxon-exception PATH]
                     [--taxon-lookup STRING] [--taxon-lookup-root STRING]
                     [--taxon-lookup-in-memory] [--taxon-id-as-xref STRING]
                     [--taxon-matching-ranks INT]
                     [--taxon-spellcheck] [--taxonomy-source STRING]
                     [--file PATH...] [file-dir PATH...]
                     [--remote-file URL...] [--remote-file-dir URL...]
                     [--taxon-id STRING] [--assembly-id STRING]
                     [--sample-id STRING] [--analysis-id STRING]
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
    --sample-dir PATH          Path to directory containing sample-level data.
    --feature-dir PATH         Path to directory containing feature-level data.
    --taxon-lookup-root STRING Root taxon Id for in-memory lookup.
    --taxon-lookup STRING      Taxon name class to lookup (scientific|any). [Default: scientific]
    --taxon-lookup-in-memory   Flag to use in-memory taxon name lookup.
    --taxon-id-as-xref STRING  Set source DB name to treat taxon_id in file as xref.
    --taxon-matching-ranks INT Number of ancestral ranks that must match to import a taxon based on
                               name match. [Default: 2]
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
    --sample-id STRING         Sample ID to index files against.
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
# import time
from collections import defaultdict
from pathlib import Path
from time import sleep
from traceback import format_exc

from docopt import docopt
from tolkein import tolog
from tqdm import tqdm

from ..lib import es_functions
from ..lib import feature
from ..lib import hub
from ..lib import taxon
from . import sample
from .attributes import index_types
from .config import config
from .es_functions import index_stream
from .files import index_files
from .files import index_metadata
from .hub import list_files
from .hub import process_row
from .hub import set_column_indices
from .hub import strip_comments
from .hub import write_imported_rows
from .hub import write_imported_taxa
from .hub import write_spellchecked_taxa
from .sample import add_identifiers_and_attributes_to_entries
from .taxon import add_names_and_attributes_to_taxa
from .taxon import fix_missing_ids
from .taxon import load_taxon_table
from .taxon import translate_xrefs
from .test import test_json_dir
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
                "additional_taxon": entry.get("additional_taxon", False),
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


def index_taxon_records(es, taxonomy_name, opts, with_ids, blanks, types):
    """Index a taxon records."""
    taxon_template = taxon.index_template(taxonomy_name, opts)
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


def index_sample_records(
    es, taxonomy_name, opts, with_ids, blanks, taxon_types, taxon_asm_data, index_type="sample"
):
    """Index sample records."""
    sample_template = sample.index_template(taxonomy_name, opts, index_type=index_type)
    taxon_template = taxon.index_template(taxonomy_name, opts)
    docs = add_identifiers_and_attributes_to_entries(
        es,
        with_ids,
        opts,
        template=sample_template,
        taxon_template=taxon_template,
        blanks=blanks,
        index_type=index_type,
    )
    index_stream(
        es,
        sample_template["index_name"],
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


def process_taxon_sample_records(
    es,
    taxonomy_name,
    opts,
    processed_rows,
    with_ids,
    blanks,
    taxon_asm_data,
    imported_rows,
    types,
    failed_rows,
    header,
    taxon_table,
    taxon_types,
):
    """Process taxon and sample records."""
    taxon_template = taxon.index_template(taxonomy_name, opts)
    without_ids = defaultdict(list)
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
            index_taxon_records(es, taxonomy_name, opts, with_ids, blanks, types)
        elif opts["index"] == "assembly":
            # TODO: keep track of taxon_id not found exceptions
            index_sample_records(
                es, taxonomy_name, opts, with_ids, blanks, taxon_types, taxon_asm_data, index_type="assembly"
            )
        elif opts["index"] == "sample":
            # TODO: keep track of taxon_id not found exceptions
            index_sample_records(
                es, taxonomy_name, opts, with_ids, blanks, taxon_types, taxon_asm_data, index_type="sample"
            )


def convert_features_to_docs(with_ids):
    """Convert features to docs."""
    for taxon_id, entries in with_ids.items():
        for entry in entries:
            entry["taxon_id"] = taxon_id
            del entry["taxon_names"]
            del entry["taxonomy"]
            del entry["taxon_attributes"]
            yield ("feature-%s" % entry["feature_id"], entry)


def index_feature_records(es, opts, taxonomy_name, with_ids, blanks):
    """Index a feature records."""
    feature_template = feature.index_template(taxonomy_name, opts)
    # TODO: allow for adding attributes to existing features
    # TODO: allow for elevating summary attributes to assembly/taxon
    docs = convert_features_to_docs(dict(with_ids))
    index_stream(
        es,
        feature_template["index_name"],
        docs,
        dry_run=opts.get("dry-run", False),
    )


def index_file(es, types, names, data, opts, *, taxon_table=None, shared_values=None, exclusions=None):
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
    failed_rows = defaultdict(list)
    imported_rows = []
    blanks = set(["", "NA", "N/A", "None"])
    taxon_types = {}
    taxonomy_name = opts["taxonomy-source"].lower()
    LOGGER.info("Processing rows")
    processed_rows = defaultdict(list)
    for row in tqdm(rows):
        try:
            processed_data, taxon_data, new_taxon_types = process_row(
                types, names, row, shared_values, blanks, index_type=opts["index"], exclusions=exclusions,
            )
        except Exception:
            print(format_exc())
            failed_rows["None"].append(row)
            continue
        if processed_data is None:
            continue
        taxon_types.update(new_taxon_types)
        if opts["index"] == "feature" and not_blank(
            "taxon_id", processed_data["taxonomy"], blanks
        ):
            with_ids[processed_data["taxonomy"]["taxon_id"]].append(processed_data)
        elif not_blank("_taxon_id", processed_data["taxonomy"], blanks):
            # if opts["taxon-id-as-xref"]:
            with_ids[processed_data["taxonomy"]["_taxon_id"]].append(processed_data)
            taxon_asm_data[processed_data["taxonomy"]["_taxon_id"]].append(taxon_data)
            imported_rows.append(row)
        else:
            tmp_taxon_id = "other"
            if not_blank("taxon_id", processed_data["taxonomy"], blanks):
                tmp_taxon_id = processed_data["taxonomy"]["taxon_id"]
            processed_rows[tmp_taxon_id].append((processed_data, taxon_data, row))
    if opts["index"] in ["taxon", "sample", "assembly"]:
        process_taxon_sample_records(
            es,
            taxonomy_name,
            opts,
            processed_rows,
            with_ids,
            blanks,
            taxon_asm_data,
            imported_rows,
            types,
            failed_rows,
            header,
            taxon_table,
            taxon_types,
        )
    elif opts["index"] == "feature":
        index_feature_records(es, opts, taxonomy_name, with_ids, blanks)


def index_taxon_sample(es, opts, index="taxon", *, dry_run=False, taxonomy_name):
    """Call taxon- or sample-specific indexing functions."""
    taxon_table = None
    if taxon_table is None and "taxon-lookup-in-memory" in opts:
        taxon_table = {
            "scientific": defaultdict(list),
            "any": defaultdict(list),
        }
        load_taxon_table(es, opts, taxonomy_name, taxon_table)
    data_dir = "%s-dir" % index
    if data_dir in opts:
        dir_path = opts[data_dir]
        for types_file in sorted(Path(dir_path).glob("*.names.yaml")):
            types, data, names, exclusions = validate_types_file(
                types_file, dir_path, es, index, opts
            )
            if "file" in types and "name" in types["file"]:
                LOGGER.info("Indexing %s" % types["file"]["name"])
                index_types(es, index, types, opts, dry_run=dry_run)
                index_file(
                    es,
                    types,
                    names,
                    data,
                    {
                        **opts,
                        "index": index,
                        "index_types": index_types,
                    },
                    taxon_table=taxon_table,
                )
                if "tests" in types["file"]:
                    result = test_json_dir(
                        "%s/%s" % (dir_path, types["file"]["tests"]),
                        opts["es-host"][0],
                        opts,
                    )
                    if result is False:
                        LOGGER.error("Failed tests")
                        exit(1)
                # time.sleep(5)
        for types_file in sorted(Path(dir_path).glob("*.types.yaml")):
            types, data, names, exclusions = validate_types_file(
                types_file, dir_path, es, index, opts
            )
            LOGGER.info("Indexing types")
            index_types(es, index, types, opts, dry_run=dry_run)
            if "file" in types and "name" in types["file"]:
                LOGGER.info("Indexing %s" % types["file"]["name"])
                index_file(
                    es,
                    types,
                    names,
                    data,
                    {
                        **opts,
                        "index": index,
                        "index_types": index_types,
                    },
                    taxon_table=taxon_table,
                    exclusions=exclusions
                )
                if "tests" in types["file"]:
                    result = test_json_dir(
                        "%s/%s" % (dir_path, types["file"]["tests"]),
                        opts["es-host"][0],
                        opts,
                    )
                    if result is False:
                        LOGGER.error("Failed tests")
                        exit(1)


def set_feature_types(types):
    """Set types for feature properties."""
    if "features" not in types:
        return
    defaults = {
        "feature_id": "keyword",
        "assembly_id": "keyword",
        "sample_id": "keyword",
        "taxon_id": "keyword",
        "primary_type": "keyword",
    }
    for key, value in defaults.items():
        if key in types["features"]:
            if not isinstance(types["features"][key], dict):
                types["features"][key] = {"default": types["features"][key]}
            types["features"][key]["type"] = value


def index_features(es, opts, *, dry_run=False):
    """Index assembly features."""
    index = "feature"
    data_dir = "%s-dir" % index
    if data_dir in opts:
        dir_path = opts[data_dir]
    stored_attributes = {}
    file_list = list_files(dir_path, "*.types.yaml")
    shared_values = defaultdict(dict)
    shared_values["_es"] = es
    shared_values["_opts"] = opts
    template = feature.index_template(opts["taxonomy-source"].lower(), opts)
    shared_values["_index"] = template["index_name"]
    shared_values["_index_type"] = index
    for types_file in file_list:
        types, data, names, exclusions = validate_types_file(
            types_file, dir_path, es, index, opts, attributes=stored_attributes
        )
        LOGGER.info("Indexing types")
        if "file" in types and "name" in types["file"]:
            LOGGER.info("Indexing %s" % types["file"]["name"])
            if "features" in types:
                set_feature_types(types)
            index_types(es, index, types, opts, dry_run=dry_run)
            sleep(1)
            shared_values["_types"] = types
            index_file(
                es,
                types,
                names,
                data,
                {**opts, "index": index, "index_types": index_types},
                shared_values=shared_values,
            )
        elif "attributes" in types:
            stored_attributes = {**stored_attributes, **types["attributes"]}


def main(args):
    """Index files."""
    options = config("index", **args)

    # Start Elasticsearch
    es = es_functions.launch_es(options["index"])

    # Post search scripts
    with tolog.DisableLogger():
        hub.post_search_scripts(es)

    taxonomy_name = options["index"]["taxonomy-source"].lower()
    dry_run = options["index"].get("dry-run", False)
    for index in list(["taxon", "sample", "assembly"]):
        index_taxon_sample(
            es,
            options["index"],
            index=index,
            dry_run=dry_run,
            taxonomy_name=taxonomy_name,
        )

    if "feature-dir" in options["index"]:
        index_features(es, options["index"], dry_run=dry_run)

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
