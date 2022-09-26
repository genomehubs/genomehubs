#!/usr/bin/env python3

"""
Initialise a GenomeHubs instance.

Usage:
    genomehubs init [--hub-name STRING] [--hub-path PATH] [--hub-version PATH]
                    [--config-file PATH...] [--config-save PATH]
                    [--es-host URL...] [--es-url URL]
                    [--insdc-metadata] [--insdc-root INT...] [--restore-indices]
                    [--taxonomy-path PATH] [--taxonomy-source STRING]
                    [--taxonomy-ncbi-root INT] [--taxonomy-ncbi-url URL]
                    [--taxonomy-ott-root INT] [--taxonomy-ott-url URL]
                    [--taxonomy-jsonl PATH] [--taxonomy-format STRING]
                    [--taxonomy-root STRING] [--taxonomy-url URL]
                    [--taxonomy-file PATH...] [--taxon-preload]
                    [--docker-contain STRING...] [--docker-network STRING]
                    [--docker-timeout INT] [--docker-es-container STRING]
                    [--docker-es-image URL]
                    [--reset] [--force-reset]
                    [-h|--help] [-v|--version]

Options:
    --hub-name STRING             GenomeHubs instance name.
    --hub-path PATH               GenomeHubs instance root directory path.
    --hub-version STR             GenomeHubs instance version string.
    --config-file PATH            Path to YAML file containing configuration options.
    --config-save PATH            Path to write configuration options to YAML file.
    --es-host URL                 ElasticSearch hostname/URL and port.
    --es-url URL                  Remote URL to fetch ElasticSearch code.
    --insdc-metadata              Flag to index metadata for public INSDC assemblies.
    --insdc-root INT              Root taxid when indexing public INSDC assemblies.
    --restore-indices             Flag to restore taxon and assembly indices.
    --taxonomy-path DIR           Path to directory containing raw taxonomies.
    --taxonomy-source STRING      Name of taxonomy to use (ncbi or ott).
    --taxonomy-ncbi-root INT      Root taxid for NCBI taxonomy index.
    --taxonomy-ncbi-url URL       Remote URL to fetch NCBI taxonomy.
    --taxonomy-ott-root INT       Root taxid for Open Tree of Life taxonomy index.
    --taxonomy-ott-url URL        Remote URL to fetch Open Tree of Life taxonomy.
    --taxonomy-format STRING      Format of taxonomy (ncbi, ott). Newick support is planned.
    --taxonomy-root STRING        Root taxid.
    --taxonomy-file PATH          Taxonomy file names.
    --taxonomy-url URL            Remote URL to fetch taxonomy.
    --taxonomy-jsonl PATH         Path to JSON Lines format taxonomy file of additional taxa.
    --taxon-preload               Flag to preload all taxa in taxonomy into taxon index.
    --docker-contain STRING       GenomeHubs component to run in Docker.
    --docker-network STRING       Docker network name.
    --docker-timeout STRING       Time in seconds to wait for a component to start in
                                  Docker.
    --docker-es-container STRING  ElasticSearch Docker container name.
    --docker-es-image STRING      ElasticSearch Docker image name.
    --reset                       Flag to reset GenomeHubs instance if already exists.
    --force-reset                 Flag to force reset GenomeHubs instance if already
                                  exists.
    -h, --help                    Show this
    -v, --version                 Show version number

Examples:
    # 1. New GenomeHub with default settings
    ./genomehubs init

    # 2. New GenomeHub in specified directory, populated with Lepidoptera assembly
    #    metadata from INSDC
    ./genomehubs init --hub-path /path/to/GenomeHub --insdc-root 7088 --insdc-meta
"""

import re
import sys
from collections import defaultdict

import ujson
from docopt import docopt
from tolkein import tofile
from tolkein import tolog

from ..lib import analysis
from ..lib import es_functions
from ..lib import feature
from ..lib import files
from ..lib import hub
from ..lib import taxon
from ..lib import taxonomy
from . import sample
from .config import config
from .version import __version__

LOGGER = tolog.logger(__name__)


def extend_lineage(entry):
    """Add current taxon to beginning of lineage."""
    new_lineage = [
        {
            "node_depth": 0,
            "taxon_id": entry["taxon_id"],
            "taxon_rank": entry["taxon_rank"],
            "scientific_name": entry["scientific_name"],
        }
    ]
    for obj in entry["lineage"]:
        new_obj = {**obj}
        new_obj["node_depth"] += 1
        new_lineage.append(new_obj)
    return new_lineage


def process_subspecies(data):
    """Find species name from subspecies and add to lineage."""
    qualifiers = {"subsp.", "ssp.", "var", "var."}
    parts = data["scientificName"].split(" ")
    species = None
    if len(parts) == 3:
        species = parts[:2]
    elif len(parts) >= 4 and parts[2] in qualifiers:
        species = parts[:2]
    if species is None:
        return False
    species = " ".join(species)
    ancestors = re.split(r";\s*", data["lineage"])
    if species not in ancestors:
        ancestors.append(species)
        data["lineage"] = "; ".join(ancestors) + "; "
    return True


def add_jsonl_to_taxonomy(stream, jsonl):
    """Add entries from JSON Lines format file to taxonomy stream."""
    lineages = defaultdict(list)
    root = None
    for doc_id, entry in stream:
        if entry["lineage"]:
            root = entry["lineage"][-1]["scientific_name"]
            # lineage = extend_lineage(entry)
            lineages[entry["scientific_name"]].append(entry["lineage"])
        yield doc_id, entry
    with tofile.open_file_handle(jsonl) as fh:
        for line in fh:
            data = ujson.decode(line)
            if data["rank"] == "subspecies":
                if not process_subspecies(data):
                    LOGGER.warn(
                        "Skipping subspecies %s (%s)",
                        data["scientificName"],
                        str(data["taxId"]),
                    )
                    continue
            entry = {
                "taxon_id": data["taxId"],
                "taxon_rank": data["rank"],
                "scientific_name": data["scientificName"],
                "taxon_names": [
                    {"name": data["scientificName"], "class": "scientific name"}
                ],
            }
            ancestors = re.split(r";\s*", data["lineage"])
            try:
                ancestors = ancestors[ancestors.index(root) : -1]
            except ValueError:
                ancestors = ancestors[:-1]
            parent = ancestors[-1]
            lineage = None
            if parent in lineages:
                if len(lineages[parent]) == 1:
                    lineage = lineages[parent][0]
                else:
                    anc_set = set(ancestors)
                    for candidate_lineage in lineages[parent]:
                        if anc_set <= set(
                            [obj["scientific_name"] for obj in candidate_lineage]
                        ):
                            lineage = candidate_lineage
                            break
            if lineage is None:
                LOGGER.warn(
                    "Unable to add taxon ID %s to the taxonomy", str(data["taxId"])
                )
                continue
            entry["lineage"] = extend_lineage({**entry, "lineage": lineage})
            entry["parent"] = lineage[0]["taxon_id"]
            lineages[entry["scientific_name"]].append(entry["lineage"])
            yield "taxon-%s" % str(entry["taxon_id"]), entry


def main(args):
    """Initialise genomehubs."""
    options = config("init", **args)

    # setup GenomeHubs directory
    hub.setup(options["init"])

    # Start Elasticsearch
    es = es_functions.launch_es(options["init"])

    # Post search scripts
    hub.post_search_scripts(es)

    # Index taxonomies
    if "taxonomy-source" in options["init"]:
        taxonomy_name = options["init"]["taxonomy-source"].lower()
        if "taxonomy-format" in options["init"]:
            template, stream = taxonomy.index(taxonomy_name, options["init"])
            if "taxonomy-jsonl" in options["init"]:
                stream = add_jsonl_to_taxonomy(
                    stream, options["init"]["taxonomy-jsonl"]
                )
            if "taxonomy-root" in options["init"]:
                es_functions.load_mapping(es, template["name"], template["mapping"])
                es_functions.index_stream(es, template["index_name"], stream)

        # Prepare taxon index
        taxon_template = taxon.index_template(taxonomy_name, options["init"])
        es_functions.load_mapping(es, taxon_template["name"], taxon_template["mapping"])
        es_functions.index_create(es, taxon_template["index_name"])
        if options["init"].get("taxon-preload", False):
            LOGGER.info("Loading all taxa from taxonomy into taxon index")
            body = {
                "source": {"index": template["index_name"]},
                "dest": {"index": taxon_template["index_name"]},
            }
            es.reindex(body=body)

        # Prepare assembly index
        assembly_template = sample.index_template(taxonomy_name, options["init"], index_type="assembly")
        es_functions.load_mapping(
            es, assembly_template["name"], assembly_template["mapping"]
        )
        es_functions.index_create(es, assembly_template["index_name"])

        # Prepare sample index
        sample_template = sample.index_template(taxonomy_name, options["init"], index_type="sample")
        es_functions.load_mapping(
            es, sample_template["name"], sample_template["mapping"]
        )
        es_functions.index_create(es, sample_template["index_name"])

        # Prepare feature index
        feature_template = feature.index_template(taxonomy_name, options["init"])
        es_functions.load_mapping(
            es, feature_template["name"], feature_template["mapping"]
        )
        es_functions.index_create(es, feature_template["index_name"])

        # Prepare analysis index
        analysis_template = analysis.index_template(taxonomy_name, options["init"])
        es_functions.load_mapping(
            es, analysis_template["name"], analysis_template["mapping"]
        )
        es_functions.index_create(es, analysis_template["index_name"])

        # Prepare file index
        file_template = files.index_template(taxonomy_name, options["init"])
        es_functions.load_mapping(es, file_template["name"], file_template["mapping"])
        es_functions.index_create(es, file_template["index_name"])


def cli():
    """Entry point."""
    if len(sys.argv) == sys.argv.index(__name__.split(".")[-1]) + 1:
        args = docopt(__doc__, argv=[])
    else:
        args = docopt(__doc__, version=__version__)
    main(args)


if __name__ == "__main__":
    cli()
