#!/usr/bin/env python3

"""NCBI taxonomy methods."""

import re

import file_io

from es_functions import base_query, nested_or


def parse_nodes(filename):
    """Parse nodes.dmp."""
    nodes = {}
    with file_io.stream_file(filename) as fh:
        for line in fh:
            taxid, parent, rank, *_ignore = re.split(r'\s*\|\s*', line)
            if taxid == '1':
                continue
            nodes[taxid] = {'parent': parent, 'rank': rank, 'names': []}
    return nodes


def add_names_to_nodes(filename, nodes):
    """Parse names.dmp and add to nodes dict."""
    with file_io.stream_file(filename) as fh:
        for line in fh:
            taxid, name, unique, name_class, *_ignore = re.split(r'\s*\|\s*', line)
            if taxid in nodes:
                if not unique:
                    unique = name
                if name_class == 'scientific name':
                    nodes[taxid].update({'taxid': taxid, 'scientific_name': name, 'unique_name': unique})
                nodes[taxid]['names'].append({'name': name, 'unique': unique, 'class': name_class})


def parse(options, _es):
    """Expand lineages from nodes dict."""
    directory = options['taxonomy']
    root = str(options['taxonomy-root'])
    nodes = parse_nodes("%s/nodes.dmp" % directory)
    add_names_to_nodes("%s/names.dmp" % directory, nodes)
    for taxid, obj in nodes.items():
        lineage = obj.copy()
        lineage.update({'lineage': []})
        descendant = False
        if taxid == root:
            descendant = True
        while 'parent' in obj and obj['parent'] in nodes:
            parent = obj['parent']
            obj = nodes[parent]
            lineage['lineage'].append({'taxid': obj['taxid'],
                                       'rank': obj['rank'],
                                       'scientific_name': obj['scientific_name']})
            if obj['taxid'] == root:
                descendant = True
                break
        if descendant:
            yield "taxid-%s" % taxid, lineage


def template():
    """Set template names."""
    return {'name': 'taxonomy', 'filename': 'ncbi_taxonomy.json'}


def taxa_by_name(name):
    """Fetch taxa by name."""
    filters = []
    filters.append({'path': 'lineage',
                    'filters': [{'match': {'lineage.scientific_name': name}}]})
    filters.append({'path': 'names',
                    'filters': [{'match': {'names.unique': name}}]})
    query = nested_or(filters)
    return query


def taxa_by_taxid(taxid):
    """Fetch taxa by taxid."""
    filters = []
    filters.append({'path': 'lineage',
                    'filters': [{'match': {'lineage.taxid': taxid}}]})
    filters.append({'filters': [{'match': {'taxid': taxid}}]})
    query = nested_or(filters)
    return query


def taxa_from_taxon(taxon_list, es, index):
    """Fetch taxonomy records for all taxa matching taxon."""
    if not isinstance(taxon_list, list):
        taxon_list = [taxon_list]
    taxa = []
    for taxon in taxon_list:
        if re.match(r'\d+', taxon):
            query = taxa_by_taxid(taxon)
        else:
            query = taxa_by_name(taxon)
        res = es.search(index=index,
                        body=query)
        if res['hits']['total']['value'] > 0:
            taxa += res['hits']['hits']
    return taxa


def taxon_from_taxid(taxid, es, index):
    """Fetch taxonomy record for taxon matching taxid."""
    query = base_query([{'match': {'taxid': taxid}}])
    res = es.search(index=index,
                    body=query)
    if res['hits']['total']['value'] > 0:
        return res['hits']['hits'][0]['_source']
    return None
