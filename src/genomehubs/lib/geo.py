#!/usr/bin/env python3

"""Geographic methods."""

import re

from h3 import geo_to_h3


def degrees_to_decimal(coord):
    """Convert latitude or longitude string to decimal."""
    if coord is None:
        return None
    try:
        coord = str(coord)
        multiplier = -1 if coord[-1] in ["S", "W"] else 1
        coord = re.sub(r"[NESW]", "", coord)
        parts = re.split(r"[°ʹ″]", coord)
        if len(parts) >= 3:
            return multiplier * sum(float(x) / 60 ** n for n, x in enumerate(parts[:3]))
        return multiplier * float(coord)
    except Exception:
        return None


def process_lat_lon(lat, lon, resolution):
    """Process raw lat/lon into h3."""
    hex_coords = geo_to_h3(lat, lon, resolution)
    print(hex_coords)
    return {}
