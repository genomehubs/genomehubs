#!/usr/bin/env python3

"""GenomeHubs helper functions."""


def standard_index_name(prefix, options):
    """Set an index name."""
    taxids = [int(x) for x in options['taxonomy-root']]
    taxids.sort()
    return "%s-%s-%s" % (prefix,
                         '.'.join(map(str, taxids)),
                         options['version'])


def template_helper(obj, *args):
    """Return information based on index template."""
    try:
        key, options = args
        if key == 'name':
            return standard_index_name(obj['prefix'], options)
        if key in obj:
            return obj[key]
        return None
    except ValueError:
        return obj
