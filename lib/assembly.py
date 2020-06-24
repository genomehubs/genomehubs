#!/usr/bin/env python3

"""Assembly methods."""

import re

from es_functions import base_query, nested_or
from gh_functions import template_helper


def template(*args):
    """Set template names."""
    obj = {
        'prefix': 'assembly',
        'filename': 'assembly.json'
    }
    return template_helper(obj, *args)


def assemblies_by_taxon_name(name, filters=None):
    """Fetch assemblies by taxon name."""
    if filters is None:
        filters = []
    or_filters = []
    or_filters.append({'path': 'lineage',
                       'filters': [{'match': {'lineage.scientific_name': name}}]})
    or_filters.append({'path': 'taxon_names',
                       'filters': [{'match': {'taxon_names.unique': name}}]})
    query = nested_or(or_filters, filters)
    return query


def assemblies_by_taxid(taxid, filters=None):
    """Fetch assemblies by taxid."""
    if filters is None:
        filters = []
    or_filters = []
    or_filters.append({'path': 'lineage',
                       'filters': [{'match': {'lineage.taxid': taxid}}]})
    or_filters.append({'filters': [{'match': {'taxid': taxid}}]})
    query = nested_or(or_filters, filters)
    return query


def assemblies_from_taxon(taxon_list, meta, es, index):
    """Fetch assembly records for all assemblies matching taxon."""
    if not isinstance(taxon_list, list):
        taxon_list = [taxon_list]
    assemblies = []
    meta_filters = meta_to_filters(meta)
    for taxon in taxon_list:
        if re.match(r'\d+', taxon):
            query = assemblies_by_taxid(taxon, meta_filters)
        else:
            query = assemblies_by_taxon_name(taxon, meta_filters)
        res = es.search(index=index,
                        body=query,
                        size=10)
        if res['hits']['total']['value'] > 0:
            assemblies += res['hits']['hits']
    return assemblies


def assemblies_by_assembly_name(name, filters=None):
    """Fetch assemblies by assembly name."""
    if filters is None:
        filters = []
    or_filters = []
    or_filters.append({'path': 'identifiers',
                       'filters': [{'match': {'identifiers.identifier': name}}]})
    or_filters.append({'filters': [{'match': {'assembly_id': name}}]})
    query = nested_or(or_filters, filters)
    return query


def assemblies_by_assembly_id(assembly_id, filters=None):
    """Fetch assemblies by taxid."""
    if filters is None:
        filters = []
    filters += [{'match': {'assembly_id': assembly_id}}]
    query = base_query(filters)
    return query


def meta_to_filters(meta):
    """Convert metadata strings to list of filters."""
    statistics = {'n50', 'l50', 'n90', 'l90',
                  'count', 'span',
                  'gc_proportion', 'n_proportion',
                  'min_length', 'max_length', 'mean_length', 'median_length'}
    mapping = {'assembly': ['top_level', 'T'],
               'chromosome': ['top_level', 'T'],
               'contig': ['level', 'contig'],
               'scaffold': ['level', 'scaffold']}
    filters = []
    for string in meta:
        query_path, operator, value = string.split(':')
        if '.' in query_path:
            level, attribute = query_path.split('.')
            if attribute in statistics and level in mapping:
                level_key = "statistics.%s" % mapping[level][0]
                level_value = mapping[level][1]
                attribute_key = "statistics.%s" % attribute
                conditions = [
                    {'term': {level_key: level_value}},
                    {'range': {attribute_key: {operator: value}}}
                ]
                filters.append({'nested': {'path': 'statistics',
                                           **base_query(conditions)}})
    return filters


def assemblies_from_assembly(assembly_list, meta, es, index):
    """Fetch assembly records for all assemblies matching assembly."""
    if not isinstance(assembly_list, list):
        assembly_list = [assembly_list]
    meta_filters = meta_to_filters(meta)
    filters = []
    for assembly_name in assembly_list:
        if assembly_name.startswith('GCA_'):
            filters.append(assemblies_by_assembly_id(assembly_name, meta_filters)['query'])
        else:
            filters.append(assemblies_by_assembly_name(assembly_name, meta_filters)['query'])
    query = base_query(filters, 'should')
    res = es.search(index=index,
                    body=query,
                    size=1000)
    if res['hits']['total']['value'] > 0:
        return res['hits']['hits']
    return []
