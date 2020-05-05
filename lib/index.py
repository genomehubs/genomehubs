#!/usr/bin/env python3

"""
Index a file.

Usage:
    genomehubs index [--busco TSV...] [--fasta FASTA] [--gff3 GFF3]
                     [--interproscan TSV...]
                     [--configfile YAML...] [--skip-validation]
                     [--unique-name STRING] [--es-host HOSTNAME] [--es-port PORT]

Options:
    --busco TSV           BUSCO full_table.tsv output file.
    --fasta FASTA         FASTA sequence file.
    --gff3 GFF3           GFF3 file.
    --interproscan TSV    InterProScan output file.
    --configfile YAML     YAML configuration file.
    --skip-validation     Don't validate input files.
    --unique-name STRING  Unique name to use in Elasticseach index.
    --es-host HOSTNAME    Elasticseach hostname/URL.
    --es-port PORT        Elasticseach port number.

Examples:
    # 1. Add BUSCO scores to BlobDir
    ./genomehubs index --gff3 Assembly_name.gff3

"""

import logging
import os
import sys

from pathlib import Path

from docopt import docopt
from elasticsearch import Elasticsearch, client, helpers

# import busco
# import fasta
import file_io
import gff3
# import interproscan
from config import config
import logger

PARAMS = [{'flag': '--gff3', 'module': gff3}]
#           {'flag': '--blobdb', 'module': blob_db, 'depends': ['identifiers']},
#           {'flag': '--busco', 'module': busco, 'depends': ['identifiers']},
#           {'flag': '--text', 'module': text, 'depends': ['identifiers']},
#           {'flag': '--trnascan', 'module': trnascan, 'depends': ['identifiers']},
#           {'flag': '--cov', 'module': cov, 'depends': ['identifiers', 'length', 'ncount']},
#           {'flag': '--hits', 'module': hits, 'depends': ['identifiers', 'length']},
#           {'flag': '--synonyms', 'module': synonyms, 'depends': ['identifiers']}]
# PARAMS = set(['--taxrule', '--threads', '--pileup-args', '--evalue', '--bitscore', '--hit-count'])


def test_connection(options):
    """Test connection to Elasticsearch."""
    connected = False
    try:
        es = Elasticsearch(hosts=[{'host': options['es-host'], 'port': options['es-port']}])
        connected = es.info()
    except Exception:  # pylint: disable=broad-except
        pass
    if not connected:
        es_logger = logger.es_logger()
        es_logger.setLevel(logging.ERROR)
        es_logger.error('Could not connect to Elasticsearch')
        sys.exit(1)
    return es


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


def generate_index_name(param, template, options):
    """Generate Elasticsearch index name."""
    index_name = template['name']
    if 'unique-name' in options['index']:
        unique_name = options['index']['unique-name']
    else:
        unique_name = Path(options['index'][param['flag'].lstrip('-')]).stem
    return "%s-%s" % (index_name, unique_name.lower())


def index_entries(es, index, module, filename):
    """Load bulk entries into Elasticsearch index."""
    actions = ({
        '_index': index,
        '_id': entry_id,
        '_source': entry
        } for entry_id, entry in module.parse(filename))
    helpers.bulk(es, actions)


def main():
    """Entrypoint for genomehubs index."""
    args = docopt(__doc__)

    # Load configuration options
    options = config('index', **args)

    # Check Elasticsearch is running
    es = test_connection(options['index'])
    gh_logger = logger.gh_logger()
    gh_logger.info('Connected to Elasticsearch')

    # Loop through file types
    for param in PARAMS:
        if args[param['flag']]:
            # Load index template
            template = param['module'].template()
            load_template(es, template)
            # Generate index name
            index_name = generate_index_name(param, template, options)
            gh_logger.info("Setting index name to %s", index_name)
            # Index file
            index_entries(es, index_name, param['module'], args[param['flag']])


if __name__ == '__main__':
    main()
