#!/usr/bin/env python3

"""Elasticsearch helper functions."""

import logging
import os
import re
import sys

from collections import defaultdict

from elasticsearch import Elasticsearch, client, helpers

import file_io
import gh_logger

MAPPING = {'attribute': 'attributes',
           'cds': 'transcripts.cds',
           'exon': 'transcripts.exons',
           'intron': 'transcripts.introns',
           'lineage': 'lineages',
           'name': 'names',
           'transcript': 'transcripts',
           'utr': 'transcripts.utrs'}


def get_es_logger(debug=False):
    """Elasticsearch connection logger."""
    logging.basicConfig(**gh_logger.logger_config(debug))
    for handler in logging.getLogger().handlers:
        handler.formatter.default_msec_format = '%s.%03d'
    return logging.getLogger('elasticsearch')


def test_connection(options):
    """Test connection to Elasticsearch."""
    connected = False
    try:
        es = Elasticsearch(hosts=[{'host': options['es-host'], 'port': options['es-port']}])
        connected = es.info()
    except Exception:  # pylint: disable=broad-except
        pass
    if not connected:
        logger = get_es_logger()
        logger.setLevel(logging.ERROR)
        logger.error('Could not connect to Elasticsearch')
        sys.exit(1)
    logger = gh_logger.logger()
    logger.info('Connected to Elasticsearch')
    return es


def list_index_paths(properties):
    """List paths in index."""
    paths = []
    for key, value in properties.items():
        if value['type'] == 'nested' and 'properties' in value:
            sub_paths = list_index_paths(value['properties'])
            for sub_path in sub_paths:
                path = {'path': "%s.%s" % (key, sub_path['path'])}
                if 'description' in sub_path:
                    path.update({'description': sub_path['description']})
                else:
                    path.update({'description': "%s.%s" % (key, sub_path['path'])})
                paths.append(path)
        else:
            path = {'path': key}
            if 'meta' in value and 'description' in value['meta']:
                path.update({'description': value['meta']['description']})
            else:
                path.update({'description': value['type']})
            paths.append(path)
    return paths


def parse_index_templates():
    """Load Elasticsearch index templates."""
    script_dir = os.path.dirname(os.path.realpath(__file__))
    index_dir = os.path.join(script_dir, 'templates')
    paths = defaultdict(list)
    descriptions = defaultdict(dict)
    for index_filename in os.listdir(index_dir):
        if index_filename.endswith(".json"):
            index_template = file_io.load_yaml(os.path.join(index_dir, index_filename))
            index_paths = list_index_paths(index_template['mappings']['properties'])
            for path in index_paths:
                for pattern in index_template['index_patterns']:
                    pattern = pattern.rstrip('*')
                    paths[path['path']].append(pattern)
                    descriptions[pattern].update({path['path']: path['description']})
    return paths, descriptions


def generate_index_patterns(options):
    """Generate Elasticsearch index pattern."""
    if 'type' in options['search']:
        patterns = []
        for index_type in options['search']['type']:
            patterns.append("%s-*" % index_type)
        return patterns
    return ['*']


def base_query(filters=None):
    """Return basic query structure."""
    if filters is None:
        filters = []
    return {'query': {'bool': {'filter': filters}}}


def nested_query(query_path, filters=None):
    """Return nested query structure."""
    return {'nested': {'path': query_path, **base_query(filters)}}


def and_join(query_a, query_b):
    """Combine query terms with Boolean AND."""
    print(query_a)
    print(query_b)


def or_join(query_a, query_b):
    """Combine query terms with Boolean OR."""
    print('should')
    print('minimum_should_match')


def get_mapping(type_list):
    """Map query types to query paths."""
    query_paths = []
    for query_type in type_list:
        if query_type in MAPPING:
            query_paths.append(MAPPING[query_type])
    return query_paths


def seq_pos_query(match, type_list, outer_filters=None):
    """Generate SEQ:START-END Elasticsearch query."""
    if outer_filters is None:
        outer_filters = []
    query_seqid = match[0]
    query_start = int(match[1])
    terms = set()
    if match[2]:
        query_end = int(match[2])
    else:
        query_end = query_start
    outer_filters += [{'term': {'query_seqid': query_seqid}}]
    terms.add('query_seqid')
    if type_list:
        mapping = get_mapping(type_list)
        if len(mapping) < len(type_list):
            outer_filters += [{'range': {'query_start': {'lte': query_end}}},
                              {'range': {'query_end': {'gte': query_start}}}]
            terms.add('query_start')
            terms.add('query_end')
        for query_path in mapping:
            inner_filters = [{'range': {"%s.query_start" % query_path: {'lte': query_end}}},
                             {'range': {"%s.query_end" % query_path: {'gte': query_start}}}]
            terms.add("%s.query_start" % query_path)
            terms.add("%s.query_end" % query_path)
            inner_query = nested_query(query_path, inner_filters)
            outer_filters.append(inner_query)
    return base_query(outer_filters), terms


def asm_seq_pos_query(match, type_list):
    """Generate ASM::SEQ:START-END Elasticsearch query."""
    assembly_name = match[0].lower()
    filters = [{'term': {'assembly_name': assembly_name}}]
    query, terms = seq_pos_query(match[1:], type_list, filters)
    terms.add('assembly_name')
    return query, terms


def is_type(string, test_type):
    """Test string type."""
    try:
        test_type(string)
        return True
    except ValueError:
        return False


def feature_value_query(match, type_list, filters=None):
    """Generate FEATURE:VALUE Elasticsearch query."""
    if filters is None:
        filters = []
    feature_type = match[0]
    feature_value = match[1]
    terms = set()
    if is_type(feature_value, float):
        feature_value = float(feature_value)
        if is_type(feature_value, str):
            feature_value = str(feature_value)
        filters += [{'range': {feature_type: {'lte': feature_value}}},
                    {'range': {feature_type: {'gte': feature_value}}}]
    else:
        filters += [{'term': {feature_type: feature_value}}]
    terms.add(feature_type)
    return base_query(filters), terms


def asm_feature_value_query(match, type_list):
    """Generate ASM::FEATURE:VALUE Elasticsearch query."""
    assembly_name = match[0].lower()
    filters = [{'term': {'assembly_name': assembly_name}}]
    query, terms = feature_value_query(match[1:], type_list, filters)
    terms.add('assembly_name')
    return query, terms


def list_allowed_indices(terms, paths, indices=None):
    """Check query tems and indices are compatible."""
    logger = gh_logger.logger()
    if indices is None:
        indices = set()
    prev_terms = []
    for term in terms:
        if term not in paths:
            logger.error("Search term '%s' is not in any index", term)
            sys.exit(1)
        if not indices:
            indices.update(paths[term])
            prev_terms.append(term)
        else:
            for index in paths[term]:
                present = False
                if index in indices:
                    present = True
                    break
            if not present:
                logger.error("Search term '%s' is not found with '%s' in any index",
                             term,
                             ', '.join(prev_terms))
                sys.exit(1)
            prev_terms.append(term)
            indices = indices.intersection(paths[term])
    return indices


def split_boolean_queries(input_terms, query_id):
    """Split Boolean queries into separate terms."""
    for term in input_terms:
        try:
            term, query_id = term.split('=')
        except ValueError:
            pass
        regex = r'([^\(\)]+)'
        matches = re.sub(regex, r"\g<1>", term)
        print(matches)
    return input_terms


def build_search_query(options):
    """Generate Elasticsearch query."""
    # ASM::SEQID:start-end[type1,type2]=Q1
    # ASM::SEQID:start-end[exon]=Q2
    # ASM::busco_id:value=Q3
    # ASM::attribute.alias:value[transcript]=Q4
    # (ASM::busco_id:value OR (ASM::attribute.alias:value AND ASM::SEQID:start-end))=Q5
    # Q1::OVERLAP:exon_count:1[transcript]=Q6
    # Q1::CONTAINS:exon_count:>1[transcript]=Q7
    # Q1::WITHIN:length:>1000[intron]=Q8
    logger = gh_logger.logger()
    search_paths, descriptions = parse_index_templates()
    patterns = [
        {'pattern': r'(_*Q/d+)::(.+?):(\d+)-*(\d*)', 'function': asm_seq_pos_query},
        {'pattern': r'(.+?)::(.+?):(\d+)-*(\d*)', 'function': asm_seq_pos_query},
        {'pattern': r'(.+?):(\d+)-*(\d*)', 'function': seq_pos_query},
        {'pattern': r'(.+?)::(.+?):(.+)', 'function': asm_feature_value_query},
        {'pattern': r'(.+?):(.+)', 'function': feature_value_query}
    ]
    query_list = {}
    paths_list = []
    if 'term' in options['search']:
        # # TODO: split boolean queries
        terms = split_boolean_queries(options['search']['term'], '_Q1')
        for full_term in terms:
            query_id = '_Q1'
            term = full_term
            try:
                term, query_id = term.split('=')
            except ValueError:
                pass
            try:
                parts = re.split(r'[\]\[]', term)
                term = parts[0]
                paths_list = parts[1].split(',')
            except IndexError:
                pass
            except ValueError:
                pass
            for pattern in patterns:
                match = re.match(pattern['pattern'], term)
                if match:
                    query, terms = pattern['function'](list(match.groups()), paths_list)
                    indices = list_allowed_indices(terms, search_paths)
                    if query_id in query_list:
                        shared = query_list[query_id]['indices'].intersection(indices)
                        if not shared:
                            logger.error("Query '%s' is not compatible with '%s'",
                                         full_term,
                                         ', '.join(query_list[query_id]['terms']))
                            sys.exit(1)
                        and_join(query_list[query_id], query)
                    else:
                        query_list[query_id] = {'query': query, 'terms': [full_term], 'indices': indices}
                    break
    quit()
    return query_list['Q1']
