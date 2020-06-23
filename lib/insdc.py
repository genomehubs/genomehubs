#!/usr/bin/env python3

"""INSDC assembly methods."""

import re
import requests

from collections import defaultdict
from defusedxml import ElementTree as ET

import file_io
import taxonomy

from es_functions import nested_or


def count_taxon_assemblies(root):
    """
    Query INSDC assemblies descended from <root> taxon.

    Return count as int.
    """
    warehouse = 'https://www.ebi.ac.uk/ena/data/warehouse'
    url = ("%s/search?query=\"tax_tree(%s)\"&result=assembly&resultcount"
           % (warehouse, str(root)))
    response = requests.get(url)
    if response.ok:
        match = re.search(r'[\d,+]+', response.content.decode('utf-8'))
        return int(match.group(0).replace(',', ''))
    return 0


def list_taxon_assemblies(root, offset, count):
    """
    Query INSDC assemblies descended from <root> taxon.

    Return list of <count> entries from <offset> as tree.
    """
    warehouse = 'https://www.ebi.ac.uk/ena/data/warehouse'
    url = ("%s/search?query=\"tax_tree(%s)\"&result=assembly&display=xml&offset=%d&length=%d"
           % (warehouse, str(root), offset, count))
    try:
        response = requests.get(url)
        if response.ok:
            return response.content
        return None
    except:
        result = list_taxon_assemblies(root, offset, count)
        return result


def assemblies_from_accession(accession):
    """Query INSDC assemblies with accession."""
    browser = 'https://www.ebi.ac.uk/ena/browser/api/xml'
    url = "%s/%s" % (browser, accession)
    try:
        response = requests.get(url)
        if response.ok:
            return response.content
        return None
    except:
        result = assemblies_from_accession(accession)
        return result


def deep_find_text(data, tags):
    """
    Find nested attributes in xml.

    Return attribute value.
    """
    for tag in tags:
        try:
            data = data.find(tag)
        except:
            return None
    return data.text


def add_assembly_identifier(asm, identifiers, id_type, xml_path):
    """Add identifier to list."""
    if isinstance(xml_path, tuple):
        identifier = deep_find_text(asm, xml_path)
    else:
        identifier = asm.attrib[xml_path]
    if identifier:
        identifiers.append({'id_type': id_type, 'identifier': identifier})
        return identifier
    return None


def assembly_meta(asm, options):
    """Return dict of metadata values for an assembly."""
    genome_representation = asm.find('GENOME_REPRESENTATION').text
    if genome_representation == options['insdc-genome-representation']:
        meta = {'identifiers': [], 'statistics': []}
        meta['assembly_id'] = deep_find_text(asm, ('IDENTIFIERS', 'PRIMARY_ID'))
        meta['center_name'] = asm.attrib['center_name']
        meta['taxid'] = deep_find_text(asm, ('TAXON', 'TAXON_ID'))
        meta['title'] = asm.find('TITLE').text
        meta['description'] = asm.find('DESCRIPTION').text
        meta['assembly_level'] = asm.find('ASSEMBLY_LEVEL').text
        add_assembly_identifier(asm, meta['identifiers'], 'bioproject', ('STUDY_REF', 'IDENTIFIERS', 'PRIMARY_ID'))
        add_assembly_identifier(asm, meta['identifiers'], 'biosample', ('SAMPLE_REF', 'IDENTIFIERS', 'PRIMARY_ID'))
        gca_accession = add_assembly_identifier(asm, meta['identifiers'], 'gca_accession', 'accession')
        alias = add_assembly_identifier(asm, meta['identifiers'], 'alias', 'alias')
        wgs_prefix = deep_find_text(asm, ('WGS_SET', 'PREFIX'))
        wgs_version = deep_find_text(asm, ('WGS_SET', 'VERSION'))
        if wgs_prefix and wgs_version:
            btk_id = "%s%s" % (wgs_prefix, wgs_version.zfill(2))
        elif alias:
            btk_id = alias.replace('.', '_')
        else:
            btk_id = gca_accession.replace('.', '_')
        meta['identifiers'].append({'id_type': 'blobtoolkit_id', 'identifier': btk_id})
        targets = {
            'total-length': {'group': meta['assembly_level'], 'title': 'span'},
            'ungapped-length': {'group': meta['assembly_level'], 'title': 'ungapped_span'},
            'n50': {'group': meta['assembly_level'], 'title': 'n50'},
            'n90': {'group': meta['assembly_level'], 'title': 'n90'},
            'L50': {'group': meta['assembly_level'], 'title': 'l50'},
            'L90': {'group': meta['assembly_level'], 'title': 'l90'},
            'replicon-count': {'group': meta['assembly_level'], 'title': 'count'},
            'scaffold-count': {'group': 'scaffold', 'title': 'count'},
            'scaf-n50': {'group': 'scaffold', 'title': 'n50'},
            'scaf-n90': {'group': 'scaffold', 'title': 'n90'},
            'scaf-L50': {'group': 'scaffold', 'title': 'l50'},
            'scaf-L90': {'group': 'scaffold', 'title': 'l90'},
            'count-contig': {'group': 'contig', 'title': 'count'},
            'contig-n50': {'group': 'contig', 'title': 'n50'},
            'contig-n90': {'group': 'contig', 'title': 'n90'},
            'contig-L50': {'group': 'contig', 'title': 'l50'},
            'contig-L90': {'group': 'contig', 'title': 'l90'}
        }
        values = defaultdict(dict)
        attributes = asm.find('ASSEMBLY_ATTRIBUTES')
        for attribute in attributes.findall('ASSEMBLY_ATTRIBUTE'):
            tag = attribute.find('TAG').text
            if tag in targets:
                group = targets[tag]['group']
                title = targets[tag]['title']
                value = attribute.find('VALUE').text
                values[group].update({title: value})
        values = dict(values)
        span = int(values[meta['assembly_level']]['span'])
        ungapped_span = int(values[meta['assembly_level']]['ungapped_span'])
        gapped_span = span - ungapped_span
        values[meta['assembly_level']]['n_proportion'] = gapped_span / span
        transferable = ['n50', 'n90', 'l50', 'l90', 'span', 'n_proportion']
        for key in transferable:
            if key in values[meta['assembly_level']] and key not in values['scaffold']:
                values['scaffold'][key] = values[meta['assembly_level']][key]
            elif key not in values[meta['assembly_level']] and key in values['scaffold']:
                values[meta['assembly_level']][key] = values['scaffold'][key]
        for key, obj in values.items():
            obj.update({'level': key})
            if key == meta['assembly_level']:
                obj.update({'top_level': 'T'})
            meta['statistics'].append(obj)
        return meta
    return None


def parse(options, es):
    """Import assemblies from INSDC."""
    version = options['version']
    taxonomy_index = "%s-%s-%s" % (taxonomy.template()['name'], str(options['taxonomy-root']), version)
    xml = ''
    if not isinstance(options['insdc-root'], list):
        options['insdc-root'] = [options['insdc-root']]
    for identifier in options['insdc-root']:
        if str(identifier).isdecimal():
            found = count_taxon_assemblies(identifier)
            if found:
                offset = 0
                count = options['insdc-page-size']
                # TODO: put this in a loop to increment offset
                xml = list_taxon_assemblies(identifier, offset, count)
        elif identifier.startswith('GCA_'):
            xml = assemblies_from_accession(identifier)
        else:
            # TODO: handle non GCA accessions
            xml = ''
    assemblies = ET.fromstring(xml)
    for assembly in assemblies:
        meta = {}
        meta = assembly_meta(assembly, options)
        if meta:
            taxon = taxonomy.taxon_from_taxid(meta['taxid'], es, taxonomy_index)
            if taxon:
                meta['scientific_name'] = taxon['scientific_name']
                meta['unique_name'] = taxon['unique_name']
                meta['rank'] = taxon['rank']
                meta['taxon_names'] = taxon['names']
                meta['lineage'] = taxon['lineage']
            yield "assembly-%s" % meta['assembly_id'], meta


def template():
    """Set template names."""
    return {'name': 'assembly', 'filename': 'assembly.json'}
