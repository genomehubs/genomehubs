#!/usr/bin/env python3

"""Check yaml template is a subset of remote JSON object."""

import json
import sys
from urllib.request import Request
from urllib.request import urlopen

import yaml

BASE_URL = "http://localhost:3000/api/v0.0.1"


def is_subset(a, b, path=None):
    """Test if a is a subset of b."""

    if path is None:
        path = {}

    def recursive_check_subset(a, b, path):
        for x in a:
            if isinstance(a[x], dict):
                if x in b:
                    path[x] = {}
                    yield all(recursive_check_subset(a[x], b[x], path[x]))
                else:
                    path[x] = False
                    yield False
            else:
                if x in b and isinstance(a[x], list):
                    path[x] = []
                    matches = []
                    for i, y in enumerate(a[x]):
                        possible_path = {}
                        path[x].append(possible_path)
                        has_match = False
                        for z in b[x]:
                            path[x][i] = possible_path
                            if is_subset(y, z, path[x][i]):
                                has_match = True
                                break
                        matches.append(has_match)
                    yield all(matches)
                else:
                    status = (x in b) and (a[x] == b[x])
                    path[x] = "PASS" if status else "FAIL"
                    yield status

    return all(recursive_check_subset(a, b, path))


def main():
    """Entry point."""
    with open(sys.argv[1], "r") as stream:
        try:
            test = yaml.safe_load(stream)
        except yaml.YAMLError as err:
            print(err)
            exit(1)
        url = "%s/%s?%s" % (BASE_URL, test["endpoint"], test["querystring"])
        req = Request(url)

        req.add_header("accept", "application/json")
        content = urlopen(req).read()
        data = json.loads(content)
        template = test["assert"]
        path = {}
        try:
            assert is_subset(template, data, path)
        except AssertionError:
            print(yaml.dump(path))


if __name__ == "__main__":
    main()
