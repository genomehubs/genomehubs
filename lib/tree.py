#!/usr/bin/env python3

"""Tree methods."""

import re

from collections import defaultdict
from pathlib import Path
from ete3 import Tree

import assembly
import gff3
import taxonomy

from es_functions import nested_or
from file_io import read_file
from gh_functions import template_helper


def clade_depth(root):
    """Get distance from root to furthest tip."""
    farthest_leaf = root.get_farthest_leaf()
    tree_distance = farthest_leaf[1]
    node_distance = int(root.get_distance(farthest_leaf[0], topology_only=True))
    return tree_distance, node_distance


def assemblies_from_tree_leaf(leaf_list, es, options):
    """Set taxid for all leafs in tree."""
    if not isinstance(leaf_list, list):
        leaf_list = [leaf_list]
    assemblies = []
    assembly_index = assembly.template('name', options)
    if options['analysis-type'] == 'species_tree':
        assemblies = assembly.assemblies_from_assembly(leaf_list, {}, es, assembly_index)
        if not assemblies:
            assemblies = assembly.assemblies_from_taxon(leaf_list, {}, es, assembly_index)
    else:
        genes = gff3.assemblies_from_genes(leaf_list, es, gff3.template('name', options))
        asms = [gene['_source']['assembly_id'] for gene in genes]
        assemblies = assembly.assemblies_from_assembly(asms, {}, es, assembly_index)
    return assemblies


def set_leaf_taxids(nodes, tree, prefix, es, options):
    """Set taxid for all leafs in tree."""
    # TODO: use helpers bulk to reduce number of requests
    for leaf in tree:
        assemblies = assemblies_from_tree_leaf(leaf.name, es, options)
        nodes["%s-%s" % (prefix, leaf.name)]['taxid'] = assemblies[0]['_source']['taxid']
        nodes["%s-%s" % (prefix, leaf.name)]['scientific_name'] = assemblies[0]['_source']['scientific_name']


def parse_tree(filename, nodes, options, es):  # pylint: disable=too-many-locals
    """Parse tree file."""
    prefix = options['prefix']
    newick = read_file(filename)
    tree = Tree(newick)
    ctr = 1
    set_leaf_taxids(nodes, tree, prefix, es, options)
    for node in tree.traverse():
        if node.is_root():
            node.add_feature('name', 'root')
            doc_id = "%s-%s" % (prefix, node.name)
            nodes[doc_id]['node_id'] = node.name
            nodes[doc_id]['is_root'] = 'T'
        else:
            if node.name:
                doc_id = "%s-%s" % (prefix, node.name)
                nodes[doc_id]['node_id'] = node.name
            else:
                node.add_feature('name', "node_%d" % ctr)
                doc_id = "%s-%s" % (prefix, node.name)
                nodes[doc_id]['node_id'] = node.name
                ctr += 1
            nodes[doc_id]['distance_to_root'] = tree.get_distance(node)
            nodes[doc_id]['ancestors'] = []
            for anc in node.get_ancestors():
                anc_doc_id = "%s-%s" % (prefix, anc.name)
                ancestor = {'node_id': anc.name,
                            'taxid': nodes[anc_doc_id]['taxid']}
                if anc.is_root():
                    ancestor.update({'is_root': 'T'})
                nodes[doc_id]['ancestors'].append(ancestor)
        nodes[doc_id]['tree_type'] = options['analysis-type'].rstrip('s')
        nodes[doc_id]['tree_id'] = prefix
        if node.is_leaf():
            nodes[doc_id]['is_leaf'] = 'T'
            nodes[doc_id]['taxon_count'] = 1
        else:
            nodes[doc_id]['depth'], nodes[doc_id]['node_depth'] = clade_depth(node)
            nodes[doc_id]['leaf_count'] = 0
            nodes[doc_id]['node_count'] = 0
            nodes[doc_id]['descendants'] = []
            taxids = set()
            for leaf in node:
                leaf_doc_id = "%s-%s" % (prefix, leaf.name)
                nodes[doc_id]['leaf_count'] += 1
                nodes[doc_id]['node_count'] += 1
                leaf_taxid = nodes[leaf_doc_id]['taxid']
                descendant = {'node_id': leaf.name,
                              'is_leaf': 'T',
                              'taxid': leaf_taxid}
                taxids.add(leaf_taxid)
                nodes[doc_id]['descendants'].append(descendant)
            nodes[doc_id]['taxon_count'] = len(taxids)
            lca = taxonomy.lca_from_taxon(list(taxids), es, taxonomy.template('name', options['index']))
            nodes[doc_id]['taxid'] = lca['taxid']
            nodes[doc_id]['scientific_name'] = lca['scientific_name']


def parse(options, es):
    """Parse tree file or files."""
    filename = options['filename']
    nodes = defaultdict(dict)
    if Path(filename).is_dir():
        for file in Path(filename).glob('*'):
            if file.is_file():
                filepath = Path(file)
                prefix = re.sub(r"({}).*".format(options['suffix']),
                                r'',
                                filepath.name)
                options['prefix'] = prefix
                parse_tree(file, nodes, options, es)
    else:
        parse_tree(filename, nodes, options, es)
    for doc_id, node in nodes.items():
        yield "node-%s" % doc_id, node


def template(*args):
    """Set template names."""
    obj = {
        'prefix': 'tree',
        'filename': 'tree.json',
        'suffix': '.nhx|.nwk|.newick',
        'assembly': 'multi',
        'index_type': 'tree',
        'analysis_type': 'gene_trees'
    }
    return template_helper(obj, *args)


def assemblies_from_tree(node_list, _meta, es, options):  # pylint: disable=too-many-locals
    """Fetch assemblies by node ID."""
    if not isinstance(node_list, list):
        node_list = [node_list]
    filters = []
    or_filters = []
    nodes = []
    for node in node_list:
        try:
            tree_id, node_id = node.split(':')
            or_filters.append({'filters': [{'match': {'node_id': node_id}}]})
            or_filters.append({'filters': [{'match': {'taxid': node_id}}]})
            or_filters.append({'filters': [{'match': {'scientific_name': node_id}}]})
            if tree_id:
                filters.append({'match': {'tree_id': tree_id}})
        except ValueError:
            tree_id = node
            or_filters.append({'filters': [{'match': {'node_id': 'root'}}]})
            filters.append({'match': {'tree_id': tree_id}})
        query = nested_or(or_filters, filters)
        res = es.search(index=template('name', options),
                        body=query,
                        size=10)
        if res['hits']['total']['value'] > 0:
            nodes += res['hits']['hits']
    taxids = {}
    for node in nodes:
        if 'is_leaf' in node['_source']:
            taxids.update({node['_source']['node_id']: node['_source']['taxid']})
        else:
            for descendant in node['_source']['descendants']:
                if 'is_leaf' in descendant:
                    taxids.update({descendant['node_id']: descendant['taxid']})
    leaf_list = list(taxids.keys())
    assemblies = assemblies_from_tree_leaf(leaf_list, es, options)
    return assemblies
