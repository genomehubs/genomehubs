#!/usr/bin/env python3

"""Geographic methods."""

import re


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
            return multiplier * sum(float(x) / 60**n for n, x in enumerate(parts[:3]))
        return multiplier * float(coord)
    except Exception:
        return None
