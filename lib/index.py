#!/usr/bin/env python3

"""
Index a file.

Usage:
    genomehubs index [--assembly_id ID...] [--insdc ID...]
                     [--busco TSV...] [--fasta FASTA...] [--gff3 GFF3...]
                     [--interproscan TSV...] [--taxonomy DIR] [--taxonomy-root INT]
                     [--species-tree NWK...] [--gene-trees DIR...]
                     [--configfile YAML...] [--skip-validation]
                     [--unique-name STRING] [--es-host HOSTNAME] [--es-port PORT]

Options:
    --assembly_id ID      An assembly ID can be provided here or parsed from input filenames.
    --busco TSV           BUSCO full_table.tsv output file.
    --fasta FASTA         FASTA sequence file.
    --gff3 GFF3           GFF3 file.
    --insdc ID            Public INSDC assembly identifier or taxid.
    --interproscan TSV    InterProScan output file.
    --taxonomy DIR        NCBI taxonomy taxdump directory.
    --taxonomy-root INT   Root taxid for taxonomy index.
    --species-tree NWK    Newick or NHX format species tree file.
    --gene-trees DIR      Directory containing Newick or NHX format gene tree files.
    --configfile YAML     YAML configuration file.
    --skip-validation     Don't validate input files.
    --unique-name STRING  Unique name to use in Elasticseach index.
    --es-host HOSTNAME    Elasticseach hostname/URL.
    --es-port PORT        Elasticseach port number.

Examples:
    # 1. Index NCBI taxdump
    ./genomehubs index --taxonomy /path/to/taxdump

    # 2. Index a GFF3 file
    ./genomehubs index --gff3 Assembly_name.gff3

"""

import logging
import os
import re
import sys
import time

from pathlib import Path

from docopt import docopt
from elasticsearch import Elasticsearch, client, exceptions, helpers

import assembly
# import busco
# import fasta
import file_io
import gff3
import gh_logger
import insdc
import taxonomy
import tree
# import interproscan
from config import config
from es_functions import test_connection

LOGGER = gh_logger.logger()
PARAMS = [{'flag': '--gff3',
           'module': gff3,
           'suffix': '.gff',
           'index_type': 'gff3',
           'analysis_type': 'gene_models'},
          {'flag': '--gene-trees',
           'module': tree,
           'suffix': '.nhx|.nwk|.newick',
           'assembly': 'multi',
           'index_type': 'tree',
           'analysis_type': 'gene_trees'},
          {'flag': '--species-tree',
           'module': tree,
           'suffix': '.nhx|.nwk|.newick',
           'assembly': 'multi',
           'index_type': 'tree',
           'analysis_type': 'species_tree'},
          {'flag': '--insdc', 'module': insdc},
          {'flag': '--taxonomy', 'module': taxonomy, 'exists': 'continue'}]


def load_template(es, template):
    """Load index template into Elasticsearch."""
    script_dir = os.path.dirname(os.path.realpath(__file__))
    index_filename = os.path.join(script_dir, 'templates', template['filename'])
    if os.path.exists(index_filename):
        index_template = file_io.load_yaml(index_filename)
        es_client = client.IndicesClient(es)
        res = es_client.put_template(name=template['name'],
                                     body=index_template)
    return res


def generate_index_name(template, options):
    """Generate Elasticsearch index name."""
    index_name = template['name']
    if 'unique-name' in options['index']:
        unique_name = options['index']['unique-name']
    else:
        unique_name = str(options['index']['taxonomy-root'])
    version = options['index']['version']
    return "%s-%s-%s" % (index_name, unique_name.lower(), version)


def index_entries(es, index, module, options):
    """Load bulk entries into Elasticsearch index."""
    actions = ({
        '_index': index,
        '_id': entry_id,
        '_source': entry,
        '_op_type': 'index'
        } for entry_id, entry in module.parse(options, es))
    success, _failed = helpers.bulk(es, actions, stats_only=True)
    return success


def lookup_assembly_id(es, input_id, options):
    """Lookup assembly ID."""
    assembly_index = generate_index_name(assembly.template(), options)
    assemblies = assembly.assemblies_from_assembly(input_id, '', es, assembly_index)
    if len(assemblies) == 1:
        return assemblies[0]
    if not assemblies:
        LOGGER.error("No indexed assemblies match '%s'", input_id)
        sys.exit(1)
    assembly_list = [asm['_source']['assembly_id'] for asm in assemblies]
    LOGGER.error("The input assembly id '%s' is ambiguous", input_id)
    LOGGER.error("Found matching identifiers for '%s'", ', '.join(assembly_list))
    LOGGER.warning("The indexed file will not be linked to an assembly")
    sys.exit(1)


def update_assembly(es, assembly_index, doc_id, analyses, params, index_name, record_count):
    """Add analysis to assembly."""
    timestamp = int(time.time())
    analyses.append({'index_type': params['index_type'],
                     'index_name': index_name,
                     'analysis_type': params['analysis_type'],
                     'record_count': record_count,
                     'timestamp': timestamp})
    es.update(index=assembly_index,
              doc_type='_doc',
              id=doc_id,
              body={'doc': {'analyses': analyses}})


def main():
    """Entrypoint for genomehubs index."""
    args = docopt(__doc__)

    # Load configuration options
    options = config('index', **args)

    # Check Elasticsearch is running
    es = test_connection(options['index'])

    # Loop through file types
    fixed_assembly_id = 'assembly_id' in options['index']
    taxonomy_index = generate_index_name(taxonomy.template(), options)
    options['index']['taxonomy-index'] = taxonomy_index
    assembly_index = generate_index_name(assembly.template(), options)
    options['index']['assembly-index'] = assembly_index
    gene_index = generate_index_name(gff3.template(), options)
    options['index']['gene-index'] = gene_index
    for param in PARAMS:
        if args[param['flag']]:
            # Load index template
            template = param['module'].template()
            load_template(es, template)
            # Generate index name
            index_name = generate_index_name(template, options)
            if 'exists' in param:
                try:
                    es.indices.get(index_name)
                    LOGGER.info("Using existing taxonomy index '%s'", index_name)
                    continue
                except exceptions.NotFoundError:
                    pass
            LOGGER.info("Setting index name to %s", index_name)
            for filename in args[param['flag']]:
                # Set assembly name
                options['index']['filename'] = filename
                if 'analysis_type' in param:
                    options['index']['analysis-type'] = param['analysis_type']
                if 'suffix' in param and not fixed_assembly_id:
                    filepath = Path(filename)
                    prefix = re.sub(r"({}).*".format(param['suffix']),
                                    r'',
                                    filepath.name)
                    options['index']['prefix'] = prefix
                    options['index']['suffix'] = param['suffix']
                    if 'assembly' not in param:
                        assembly_id = prefix
                        LOGGER.info("Looking up assembly_id for %s", filepath.name)
                        asm = lookup_assembly_id(es, assembly_id, options)
                        doc_id = asm['_id']
                        try:
                            analyses = asm['_source']['analyses']
                        except KeyError:
                            analyses = []
                        options['index']['assembly_id'] = asm['_source']['assembly_id']
                        LOGGER.info("Setting assembly_id to '%s'", options['index']['assembly_id'])
                    # Index file
                    LOGGER.info("Indexing %s to %s", filepath.name, index_name)
                    record_count = index_entries(es, index_name, param['module'], options['index'])
                    LOGGER.info("Indexed %d records", record_count)
                    # Update assembly
                    if 'assembly' not in param:
                        LOGGER.info("Adding analysis to assembly %s", options['index']['assembly_id'])
                        update_assembly(es, assembly_index, doc_id, analyses, param, index_name, record_count)
                else:
                    LOGGER.info("Indexing %s to %s", template['name'], index_name)
                    record_count = index_entries(es, index_name, param['module'], options['index'])
                    LOGGER.info("Indexed %d records", record_count)


if __name__ == '__main__':
    main()
