#!/usr/bin/env python3

"""
Index a file, directory or repository.

Usage:
    genomehubs index [--hub-name STRING] [--hub-path PATH] [--hub-version PATH]
                     [--config-file PATH...] [--config-save PATH]
                     [--es-host URL...]
                     [--taxon-dir PATH...] [--taxon-repo URL...]
                     [-h|--help] [-v|--version]

Options:
    --hub-name STRING       GenomeHubs instance name.
    --hub-path PATH         GenomeHubs instance root directory path.
    --hub-version STR       GenomeHubs instance version string.
    --config-file PATH      Path to YAML file containing configuration options.
    --config-save PATH      Path to write configuration options to YAML file.
    --es-host URL           ElasticSearch hostname/URL and port.
    --taxon-dir PATH        Path to directory containing taxon-level data.
    --taxon-repo URL        Remote git repository containing taxon-level data.
                            Optionally include `~branch-name` suffix.
    -h, --help              Show this
    -v, --version           Show version number

Examples:
    # 1. Index all files in a remote repository
    ./genomehubs index --taxon-repo https://github.com/example/repo=main
"""

# """
# Index a file, directory or repository.

# Usage:
#     genomehubs index [--assembly_id ID...] [--insdc]
#                [--busco TSV...] [--fasta FASTA...] [--gff3 GFF3...]
#                [--interproscan TSV...]
#                [--taxonomy] [--taxonomy-taxdump DIR] [--taxonomy-root INT...]
#                [--species-tree NWK...] [--gene-trees DIR...]
#                [--configfile YAML...] [--skip-validation]
#                [--unique-name STRING] [--es-host HOSTNAME] [--es-port PORT]

# Options:
#     --assembly_id ID        An assembly ID can be provided here or parsed from input
#                             filenames.
#     --busco TSV             BUSCO full_table.tsv output file.
#     --fasta FASTA           FASTA sequence file.
#     --gff3 GFF3             GFF3 file.
#     --insdc                 Flag to index public INSDC assemblies.
#     --interproscan TSV      InterProScan output file.
#     --taxonomy              Flag to index taxonomy.
#     --taxonomy-taxdump DIR  NCBI taxonomy taxdump directory.
#     --taxonomy-root INT     Root taxid for taxonomy index.
#     --species-tree NWK      Newick or NHX format species tree file.
#     --gene-trees DIR        Directory containing Newick or NHX format gene tree files.
#     --configfile YAML       YAML configuration file.
#     --skip-validation       Don't validate input files.
#     --unique-name STRING    Unique name to use in Elasticseach index.
#     --es-host HOSTNAME      Elasticseach hostname/URL.
#     --es-port PORT          Elasticseach port number.
#     -h, --help              Show this
#     -v, --version           Show version number

# Examples:
#     # 1. Index NCBI taxdump
#     ./genomehubs index --taxonomy-taxdump /path/to/taxdump

#     # 2. Index a GFF3 file
#     ./genomehubs index --gff3 Assembly_name.gff3

# """

import csv
import re
import sys
from collections import defaultdict
from pathlib import Path

from docopt import docopt
from tolkein import tofile
from tolkein import tolog

from ..lib import es_functions
from ..lib import hub
from ..lib import taxon
from .attributes import index_types
from .config import config
from .es_functions import index_stream
from .es_functions import query_keyword_value_template
from .version import __version__

LOGGER = tolog.logger(__name__)


def validate_types_file(types_file, dir_path):
    """Validate types file."""
    try:
        types = tofile.load_yaml(str(types_file.resolve()))
    except Exception:
        LOGGER.error("Unable to open types file %s", str(types_file.resolve()))
        sys.exit(1)
    if "taxonomy" not in types:
        LOGGER.error("Types file contains no taxonomy information")
    if "file" not in types or "name" not in types["file"]:
        LOGGER.error("No data file name in types file")
    data = tofile.open_file_handle(Path(dir_path) / types["file"]["name"])
    return types, data


def process_row(types, row):
    """Process a row of data."""
    data = {"attributes": {}, "taxon_names": {}, "taxonomy": {}}
    for group in data.keys():
        if group in types:
            for key, meta in types[group].items():
                try:
                    if "separator" in meta and any(
                        sep in row[meta["index"]] for sep in meta["separator"]
                    ):
                        separator = "|".join(meta["separator"])
                        data[group][key] = re.split(
                            rf"\s*{separator}\s*", row[meta["index"]]
                        )
                    else:
                        data[group][key] = row[meta["index"]]
                except Exception:
                    LOGGER.warning("Cannot parse row")
                    return None
    if data["attributes"]:
        source = types["file"].get("source", None)
        data["attributes"] = hub.add_attributes(
            data["attributes"], types["attributes"], source=source
        )
    else:
        data["attributes"] = []
    return data


def chunks(arr, n):
    """Yield successive n-sized chunks from arr."""
    for i in range(0, len(arr), n):
        yield arr[i : i + n]


def add_names_to_list(existing, new):
    """Add names to a list if they do not already exist."""
    names = defaultdict(dict)
    for entry in existing:
        names[entry["class"]][entry["name"]] = True
    for name_class, name in new.items():
        name_class = name_class.replace("_", " ")
        if name_class not in names and name not in names[name_class]:
            existing.append({"name": name, "class": name_class})
            names[name_class][name] = True


def add_attribute_values(existing, new):
    """Add attribute values to records."""
    indices = {}
    for index, entry in enumerate(existing):
        indices[entry["key"]] = index
    index = len(existing)
    for entry in new:
        arr = []
        if entry["key"] in indices:
            arr = existing[indices[entry["key"]]]["values"]
        else:
            existing.append({"key": entry["key"], "values": arr})
            indices[entry["key"]] = index
            index += 1
        del entry["key"]
        arr.append(entry)


def add_names_and_attributes_to_taxa(es, data, opts, *, template):
    """Add names and attributes to taxa."""
    for values in chunks(list(data.keys()), 50):
        taxon_res = query_keyword_value_template(
            es,
            "attributes_names_by_keyword_value",
            "taxon_id",
            values,
            index=template["index_name"],
        )
        if taxon_res is not None:
            for response in taxon_res["responses"]:
                if "hits" in response and response["hits"]["total"]["value"] == 1:
                    doc = response["hits"]["hits"][0]
                    taxon_data = data[doc["_source"]["taxon_id"]]
                    taxon_names = {}
                    attributes = []
                    for entry in taxon_data:
                        if "attributes" in entry:
                            attributes = attributes + entry["attributes"]
                        if "taxon_names" in entry:
                            taxon_names.update(entry["taxon_names"])
                    add_names_to_list(doc["_source"]["taxon_names"], taxon_names)
                    if (
                        "attributes" not in doc["_source"]
                        or not doc["_source"]["attributes"]
                    ):
                        doc["_source"]["attributes"] = []
                    add_attribute_values(doc["_source"]["attributes"], attributes)
                    yield doc["_id"], doc["_source"]


def index_file(es, types, data, opts):
    """Index a file."""
    if types["file"].get("header", False):
        next(data)
    rows = csv.reader(data, delimiter="\t", quotechar='"')
    with_ids = defaultdict(list)
    without_ids = defaultdict(list)
    for row in rows:
        processed_data = process_row(types, row)
        if processed_data["taxonomy"]["taxon_id"] != "NA":
            with_ids[processed_data["taxonomy"]["taxon_id"]].append(processed_data)
        else:
            without_ids[processed_data["taxonomy"]["species"]].append(processed_data)
    for taxonomy_name in opts["taxonomy-source"]:
        template = taxon.index_template(taxonomy_name, opts)
        docs = add_names_and_attributes_to_taxa(es, with_ids, opts, template=template)
        index_stream(
            es, template["index_name"], docs, _op_type="update",
        )


def main(args):
    """Index files."""
    options = config("index", **args)

    # Start Elasticsearch
    es = es_functions.launch_es(options["fill"])

    # Post search scripts
    hub.post_search_scripts(es)

    for dir_path in options["index"]["taxon-dir"]:
        for types_file in Path(dir_path).glob("*.types.yaml"):
            types, data = validate_types_file(types_file, dir_path)
            index_types(es, "taxon", types, options["index"])
            index_file(es, types, data, options["index"])


def cli():
    """Entry point."""
    if len(sys.argv) == sys.argv.index("index") + 1:
        args = docopt(__doc__, argv=[])
    else:
        args = docopt(__doc__, version=__version__)
    main(args)


if __name__ == "__main__":
    cli()
