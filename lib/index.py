#!/usr/bin/env python3

"""
Index a file.

Usage:
    genomehubs index [--assembly_id ID...] [--insdc]
                     [--busco TSV...] [--fasta FASTA...] [--gff3 GFF3...]
                     [--interproscan TSV...]
                     [--taxonomy] [--taxonomy-taxdump DIR] [--taxonomy-root INT...]
                     [--species-tree NWK...] [--gene-trees DIR...]
                     [--configfile YAML...] [--skip-validation]
                     [--unique-name STRING] [--es-host HOSTNAME] [--es-port PORT]

Options:
    --assembly_id ID        An assembly ID can be provided here or parsed from input filenames.
    --busco TSV             BUSCO full_table.tsv output file.
    --fasta FASTA           FASTA sequence file.
    --gff3 GFF3             GFF3 file.
    --insdc                 Flag to index public INSDC assemblies.
    --interproscan TSV      InterProScan output file.
    --taxonomy              Flag to index taxonomy.
    --taxonomy-taxdump DIR  NCBI taxonomy taxdump directory.
    --taxonomy-root INT     Root taxid for taxonomy index.
    --species-tree NWK      Newick or NHX format species tree file.
    --gene-trees DIR        Directory containing Newick or NHX format gene tree files.
    --configfile YAML       YAML configuration file.
    --skip-validation       Don't validate input files.
    --unique-name STRING    Unique name to use in Elasticseach index.
    --es-host HOSTNAME      Elasticseach hostname/URL.
    --es-port PORT          Elasticseach port number.

Examples:
    # 1. Index NCBI taxdump
    ./genomehubs index --taxonomy-taxdump /path/to/taxdump

    # 2. Index a GFF3 file
    ./genomehubs index --gff3 Assembly_name.gff3

"""

import os
import re
import sys
import time

from pathlib import Path

from docopt import docopt
from elasticsearch import client, exceptions, helpers

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
PARAMS = [{'flag': '--taxonomy', 'module': taxonomy},
          {'flag': '--insdc', 'module': insdc},
          {'flag': '--gff3', 'module': gff3},
          {'flag': '--gene-trees', 'module': tree},
          {'flag': '--species-tree', 'module': tree}]


def load_template(es, template):
    """Load index template into Elasticsearch."""
    script_dir = os.path.dirname(os.path.realpath(__file__))
    index_filename = os.path.join(script_dir, 'templates', template['filename'])
    if os.path.exists(index_filename):
        index_template = file_io.load_yaml(index_filename)
        es_client = client.IndicesClient(es)
        res = es_client.put_template(name=template['prefix'],
                                     body=index_template)
    return res


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
    assembly_index = assembly.template('name', options)
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


def update_assembly(es, **kwargs):
    """Add analysis to assembly."""
    timestamp = int(time.time())
    kwargs['analyses'].append({'index_type': kwargs['index_type'],
                               'index_name': kwargs['index_name'],
                               'analysis_type': kwargs['analysis_type'],
                               'record_count': kwargs['record_count'],
                               'timestamp': timestamp})
    es.update(index=kwargs['assembly_index'],
              doc_type='_doc',
              id=kwargs['doc_id'],
              body={'doc': {'analyses': kwargs['analyses']}})


def index_data(es, filenames, param, options):
    """Parse files and index data."""
    if isinstance(filenames, bool):
        filenames = [None]
    # Load index template
    load_template(es, param['module'].template())
    # Generate index name
    index_name = param['module'].template('name', options['index'])
    if param['module'].template('exists', options['index']):
        try:
            es.indices.get(index_name)
            LOGGER.info("Using existing index '%s'", index_name)
            return
        except exceptions.NotFoundError:
            pass
    LOGGER.info("Setting index name to %s", index_name)
    fixed_assembly_id = 'assembly_id' in options['index']
    for filename in filenames:
        # Set assembly name
        options['index']['filename'] = filename
        options['index']['suffix'] = param['module'].template('suffix', options['index'])
        assembly_id = param['module'].template('assembly', options['index'])
        if options['index']['suffix'] and not fixed_assembly_id:
            filepath = Path(filename)
            prefix = re.sub(r"({}).*".format(options['index']['suffix']),
                            r'',
                            filepath.name)
            options['index']['prefix'] = prefix
            if not assembly_id:
                assembly_id = prefix
                LOGGER.info("Looking up assembly_id for %s", filepath.name)
                asm = lookup_assembly_id(es, assembly_id, options['index'])
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
            if not assembly_id:
                LOGGER.info("Adding analysis to assembly %s", options['index']['assembly_id'])
                update_assembly(es,
                                assembly_index=param['module'].template('name', options['index']),
                                doc_id=doc_id,
                                analyses=analyses,
                                index_type=param['module'].template('index_type', options['index']),
                                analysis_type=param['module'].template('analysis_type', options['index']),
                                index_name=index_name,
                                record_count=record_count)
        else:
            LOGGER.info("Indexing to '%s'", index_name)
            record_count = index_entries(es, index_name, param['module'], options['index'])
            LOGGER.info("Indexed %d records", record_count)


def main():
    """Entrypoint for genomehubs index."""
    args = docopt(__doc__)

    # Load configuration options
    options = config('index', **args)

    # Check Elasticsearch is running
    es = test_connection(options['index'])

    # Loop through file types and index
    for param in PARAMS:
        if args[param['flag']]:
            index_data(es, filenames=args[param['flag']], param=param, options=options)


if __name__ == '__main__':
    main()
