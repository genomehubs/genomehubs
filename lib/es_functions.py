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


class DisableLogger():
    """Logger context management."""

    def __enter__(self):
        logging.disable(logging.CRITICAL)

    def __exit__(self, a, b, c):
        logging.disable(logging.NOTSET)


def test_connection(options, _continue=False):
    """Test connection to Elasticsearch."""
    connected = False
    with DisableLogger():
        try:
            es = Elasticsearch(hosts=[{'host': options['es-host'], 'port': options['es-port']}])
            connected = es.info()
        except Exception:  # pylint: disable=broad-except
            pass
    if not connected:
        message = "Could not connect to Elasticsearch at '%s:%s'" % (options['es-host'], str(options['es-port']))
        if not _continue:
            logger = get_es_logger()
            logger.setLevel(logging.ERROR)
            logger.error(message)
            sys.exit(1)
        return False
    if not _continue:
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


def base_or(filter_list):
    """Return basic OR query structure."""
    filters = []
    for obj in filter_list:
        filters.append(base_query(obj['filters']))
    return {'query': {'bool': {'should': filters}}}


def nested_query(query_path, filters=None):
    """Return nested query structure."""
    return {'nested': {'path': query_path, **base_query(filters)}}


def nested_or(filter_list, _and_list=None):
    """Return nested OR query structure."""
    filters = []
    for obj in filter_list:
        if 'path' in obj:
            query = nested_query(obj['path'], obj['filters'])
            if _and_list:
                query = base_query([query] + _and_list)
                query = query['query']
            filters.append(query)
        else:
            if _and_list:
                query = base_query(obj['filters'] + _and_list)
                query = query['query']
                filters.append(query)
            else:
                filters += obj['filters']
    return {'query': {'bool': {'should': filters}}}


def and_join(query_a, query_b, shared):
    """Combine query terms with Boolean AND."""
    query_a['query']['query']['bool']['filter'] += query_b['query']['query']['bool']['filter']
    query_a['indices'] = shared
    query_a['terms'] += query_b['terms']


def or_join(query_a, query_b, shared):
    """Combine query terms with Boolean OR."""
    print('should')
    print('minimum_should_match')


def join_queries(full_term, existing_query, indices, query, join_func):
    """Test for overlapping indices then join queries."""
    logger = gh_logger.logger()
    shared = existing_query['indices'].intersection(indices)
    if not shared:
        logger.error("Query '%s' is not compatible with '%s'",
                     full_term,
                     ', '.join(existing_query['terms']))
        sys.exit(1)
    join_func(existing_query, query, shared)


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
        if match[2] == '-':
            query_end = 2147483647
        else:
            query_end = -int(match[2])
    else:
        query_end = query_start
    print(query_end)
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
    else:
        outer_filters += [{'range': {'query_start': {'lte': query_end}}},
                          {'range': {'query_end': {'gte': query_start}}}]
        terms.add('query_start')
        terms.add('query_end')
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

def split_boolean_query(qqid, term):
    """Split boolean queries into separate terms."""
    if re.match(r'\(.+\)', term):
        print({qqid: [term]})
        return {qqid: [term]}
    sub_terms = re.split(r'\s+(AND|NOT|OR)\s+', term)
    split_terms = {}
    stid = 0
    operators = ['AND', 'NOT', 'OR']
    negate = False
    for index, sub_term in enumerate(sub_terms):
        if sub_term in operators:
            if sub_term == 'NOT':
                negate = True
            elif sub_term == 'OR':
                stid += 1
        else:
            term_id = "%s___%d" % (qqid, stid)
            if negate:
                sub_term = "!%s" % sub_term
                negate = False
            if term_id in split_terms:
                split_terms[term_id].append(sub_term)
            else:
                split_terms.update({term_id: [sub_term]})
    return split_terms


def split_nested_queries(input_terms):
    """Split nested queries into separate terms."""
    queries = {}
    used_ids = set()
    for term in input_terms:
        try:
            term, query_id = term.split('=')
            tid = int(re.sub(r'[a-zA-Z_]+', '', query_id))
            used_ids.add(tid)
        except ValueError:
            pass
    if used_ids:
        tid = max(used_ids) + 1
    else:
        tid = 1
    for term in input_terms:
        try:
            term, query_id = term.split('=')
        except ValueError:
            query_id = "Q%d" % tid
            tid += 1
        regex = r'\(([^\(^\)]+)\)'
        qid = 0
        match = re.search(regex, term)
        while match:
            match = list(match.groups())
            for sub_term in match:
                qqid = "%s__%d" % (query_id, qid)
                sub_terms = split_boolean_query(qqid, sub_term)
                queries.update(sub_terms)
                term = term.replace("(%s)" % sub_term, qqid)
                qid += 1
            match = re.search(regex, term)
        qqid = "%s__%d" % (query_id, qid)
        sub_terms = split_boolean_query(qqid, term)
        for sub_term_id, terms_list in sub_terms.items():
            if sub_term_id in queries:
                queries[sub_term_id] += terms_list
            else:
                queries.update({sub_term_id: terms_list})
    return queries


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
        {'pattern': r'(_*Q/d+)::(.+?):(\d+)(-*\d*)', 'function': asm_seq_pos_query},
        {'pattern': r'(.+?)::(.+?):(\d+)(-*\d*)', 'function': asm_seq_pos_query},
        {'pattern': r'(.+?):(\d+)(-*\d*)', 'function': seq_pos_query},
        {'pattern': r'(.+?)::(.+?):(.+)', 'function': asm_feature_value_query},
        {'pattern': r'(.+?):(.+)', 'function': feature_value_query}
    ]
    query_list = {}
    query_map = defaultdict(list)
    paths_list = []
    if 'term' in options['search']:
        terms = split_nested_queries(options['search']['term'])
        for long_id, terms_list in terms.items():
            base_id, sub_id, part_id = re.split(r'_+', long_id)
            query_id = "%s__%s" % (base_id, sub_id)
            query_map[query_id].append(long_id)
            query_map[base_id].append(long_id)
            print(long_id)
            print(terms_list)
            for full_term in terms_list:
                term = full_term
                try:
                    parts = re.split(r'[\]\[]', term)
                    term = parts[0]
                    paths_list = parts[1].split(',')
                except IndexError:
                    pass
                except ValueError:
                    pass
                pattern_match = False
                for pattern in patterns:
                    match = re.match(pattern['pattern'], term)
                    if match:
                        pattern_match = True
                        query, terms = pattern['function'](list(match.groups()), paths_list)
                        indices = list_allowed_indices(terms, search_paths)
                        query = {'query': query, 'terms': [full_term], 'indices': indices}
                        if long_id in query_list:
                            # AND join
                            join_queries(full_term, query_list[long_id], indices, query, and_join)
                        elif len(query_map[base_id]) > 1:
                            # OR query
                            join_queries(full_term, query_list[query_map[base_id][0]], indices, query, or_join)
                        else:
                            query_list[long_id] = query
                        break
                if not pattern_match:
                    print('no match for term')
                    print(term)
        quit()
    #     for full_term in terms:
    #         term = full_term
    #         try:
    #             parts = re.split(r'[\]\[]', term)
    #             term = parts[0]
    #             paths_list = parts[1].split(',')
    #         except IndexError:
    #             pass
    #         except ValueError:
    #             pass
    #         for pattern in patterns:
    #             match = re.match(pattern['pattern'], term)
    #             if match:
    #                 query, terms = pattern['function'](list(match.groups()), paths_list)
    #                 indices = list_allowed_indices(terms, search_paths)
    #                 if query_id in query_list:
    #                     shared = query_list[query_id]['indices'].intersection(indices)
    #                     if not shared:
    #                         logger.error("Query '%s' is not compatible with '%s'",
    #                                      full_term,
    #                                      ', '.join(query_list[query_id]['terms']))
    #                         sys.exit(1)
    #                     and_join(query_list[query_id], query)
    #                 else:
    #                     query_list[query_id] = {'query': query, 'terms': [full_term], 'indices': indices}
    #                 break
    # quit()
    # return query_list['Q1']
