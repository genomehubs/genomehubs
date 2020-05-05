#!/usr/bin/env python3

"""
Search for entries.

Usage:
    genomehubs search [--term STRING...] [--type STRING...]
                      [--configfile YAML...]
                      [--es-host HOSTNAME] [--es-port PORT]

Options:
    --term STRING         Simple or Boolean search string.
    --type STRING         Types to search.
    --configfile YAML     YAML configuration file.
    --es-host HOSTNAME    Elasticseach hostname/URL.
    --es-port PORT        Elasticseach port number.

Examples:
    # 1. Find all features of specified types in specified location on specific assembly
    ./genomehubs search --term ASMID::SEQID:SSTART-SEND \
                        --types gff3,blast,interproscan

    # 2. Find all features of all types in specified location across all sequences
    ./genomehubs search --term ASMID::SSTART-SEND

    # 3. Find specific features by value
    ./genomehubs search --term feature=VALUE
    ./genomehubs search --term ASMID::feature=VALUE
    ./genomehubs search --term ASMID::SEQID:feature=VALUE
                        --types blast,interproscan

    # 4. Use Boolean operators
    ./genomehubs search --term 'FEATURE=VALUE AND ASMID::SEQID:SSTART-SEND'
    ./genomehubs search --term '(FEATURE_1=VALUE AND ASMID_1::SEQID:SSTART-SEND) OR ASMID_2::FEATURE_2=VALUE'

"""

import logging
import re
import sys

from pathlib import Path

from docopt import docopt
from elasticsearch import Elasticsearch, client, helpers

# import busco
# import fasta
import gff3
import gh_logger
# import interproscan
from config import config
from es_functions import build_search_query, test_connection

PARAMS = [{'flag': '--gff3', 'module': gff3}]


def generate_index_patterns(options):
    """Generate Elasticsearch index pattern."""
    if 'type' in options['search']:
        patterns = []
        for index_type in options['search']['type']:
            patterns.append("%s-*" % index_type)
        return patterns
    return ['*']


def main():
    """Entrypoint for genomehubs search."""
    args = docopt(__doc__)

    # Load configuration options
    options = config('search', **args)

    # Check Elasticsearch is running
    es = test_connection(options['search'])

    # Generate index pattern and query
    logger = gh_logger.logger()
    index_patterns = generate_index_patterns(options)
    search_query = build_search_query(options)
    if search_query:
        if 'suffix' in search_query and search_query['suffix']:
            index_patterns = ["%s%s" % (pattern, search_query['suffix']) for pattern in index_patterns]
            print(','.join(index_patterns))
        res = es.search(index=','.join(index_patterns), body=search_query)
        print(res)
    else:
        logger.info('No query to execute')

    # # Loop through file types
    # for type in TYPES:
    #     if args[type['flag']]:
    #         # Load index template
    #         template = type['module'].template()
    #         load_template(es, template)
    #         # Generate index name
    #         index_name = generate_index_name(type, template, options)
    #         gh_logger.info("Setting index name to %s" % index_name)
    #         # Index file
    #         index_entries(es, index_name, type['module'], args[type['flag']])


if __name__ == '__main__':
    main()
