#!/usr/bin/env python3

"""GFF3 methods."""

import file_io


def make_introns(feature, count):
    """Add explicit introns to transcripts."""
    for transcript in feature['transcripts']:
        intron_start = None
        intron_end = None
        introns = []
        exons = transcript['exons']
        transcript['exon_count'] = len(exons)
        transcript['exon_length'] = 0
        transcript['intron_length'] = 0
        if '-' in feature['strand']:
            exons.reverse()
        for index, exon in enumerate(exons):
            exon.update({'index': index})
            transcript['exon_length'] += int(exon['length'])
            intron_id = "%s:intron:%d" % (transcript['transcript_id'], count)
            if '-' in feature['strand']:
                intron_start = int(exon['query_end']) + 1
            else:
                intron_end = int(exon['query_start']) + 1
            if intron_start and intron_end:
                intron = {'intron_id': intron_id,
                          'query_start': intron_start,
                          'query_end': intron_end,
                          'length': intron_end - intron_start + 1,
                          'index': index - 1}
                introns.append(intron)
                transcript['intron_length'] += intron['length']
                count += 1
            if '-' in feature['strand']:
                intron_end = int(exon['query_start']) - 1
            else:
                intron_start = int(exon['query_end']) + 1
        if '-' in feature['strand']:
            exons.reverse()
            if introns:
                transcript['introns'] = introns
                transcript['introns'].reverse()
    return count


def parse(filename):
    """Parse gff3 file."""
    cols = ['query_seqid', 'source_tag', 'primary_tag', 'query_start', 'query_end',
            'score', 'strand', 'frame', '_attributes']
    transcripts = ['mRNA']
    utrs = ['five_prime_utr', 'three_prime_utr']
    gene = {}
    transcript = {}
    feature = {}
    reset = True
    intron_count = 0
    with file_io.stream_file(filename) as fh:
        for line in fh:
            if line.startswith('#'):
                continue
            line = line.rstrip()
            fields = {cols[index]: value for index, value in enumerate(line.split('\t'))}
            if fields['score'] == '.':
                fields['score'] = 0
            fields['length'] = int(fields['query_end']) - int(fields['query_start']) + 1
            attributes = {key: value for key, value in [attr.split('=') for attr in fields['_attributes'].split(';')]}
            del fields['_attributes']
            if fields['primary_tag'] == 'gene':
                gene = fields
                del gene['primary_tag']
                del gene['frame']
                gene['transcripts'] = []
                if 'stable_id' in attributes:
                    gene['gene_id'] = attributes['stable_id']
                else:
                    gene['gene_id'] = attributes['ID']
                del attributes['ID']
                attributes.pop('Parent', None)
                if attributes:
                    gene['attributes'] = attributes
                transcript = {}
                if feature:
                    intron_count = make_introns(feature, intron_count)
                    reset = True
                    yield "gene-%s" % feature['gene_id'], feature
            else:
                if reset:
                    feature = gene
                    reset = False
                    gene = {}
                    transcript = {}
                if fields['primary_tag'] in transcripts:
                    transcript = fields
                    del transcript['query_seqid']
                    del transcript['score']
                    del transcript['strand']
                    del transcript['frame']
                    if 'stable_id' in attributes:
                        transcript['transcript_id'] = attributes['stable_id']
                    else:
                        transcript['transcript_id'] = attributes['ID']
                    transcript['exons'] = []
                    transcript['utrs'] = []
                    if fields['primary_tag'] == 'mRNA':
                        transcript['cds'] = []
                        transcript['cds_length'] = 0
                        if 'translation_stable_id' in attributes:
                            transcript['translation_id'] = attributes['translation_stable_id']
                        else:
                            transcript['translation_id'] = transcript['transcript_id']
                    feature['transcripts'].append(transcript)
                    del attributes['ID']
                    attributes.pop('Parent', None)
                    if attributes:
                        transcript['attributes'] = attributes
                elif fields['primary_tag'] == 'CDS':
                    cds = {'query_start': fields['query_start'],
                           'query_end': fields['query_end'],
                           'length': fields['length'],
                           'frame': fields['frame']}
                    transcript['cds'].append(cds)
                    transcript['cds_id'] = attributes['ID']
                    transcript['cds_length'] += int(cds['length'])
                elif fields['primary_tag'] == 'exon':
                    exon = {'exon_id': attributes['ID'],
                            'query_start': fields['query_start'],
                            'query_end': fields['query_end'],
                            'length': fields['length']}
                    del attributes['ID']
                    attributes.pop('Parent', None)
                    if attributes:
                        exon['attributes'] = attributes
                    transcript['exons'].append(exon)
                elif fields['primary_tag'] in utrs:
                    utr = {'utr_id': attributes['ID'],
                           'query_start': fields['query_start'],
                           'query_end': fields['query_end'],
                           'length': fields['length'],
                           'primary_tag': fields['primary_tag']}
                    del attributes['ID']
                    attributes.pop('Parent', None)
                    if attributes:
                        utr['attributes'] = attributes
                    transcript['utrs'].append(utr)
    make_introns(feature, intron_count)
    yield "gene-%s" % feature['gene_id'], feature


def template():
    """Set template names."""
    return {'name': 'gff3', 'filename': 'gff3.json'}
