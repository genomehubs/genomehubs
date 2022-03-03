#!/usr/bin/env python3

"""
Test GenomeHubs API responses.

Usage:
    test_api_responses.py [--base-url URL] --json-test-dir DIR...

Options:
    --base-url URL       GenomeHubs API base url. [Default: http://localhost:3000/api/v2]
    --json-test-dir DIR  Directory containing templates for json response tests.
"""

import json
import os
from textwrap import indent
from urllib.request import Request
from urllib.request import urlopen

import yaml
from docopt import docopt

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


def json_response_tests(base_url, template_dir):
    """Check yaml template is a subset of remote JSON object."""
    required_headers = {"assert", "endpoint", "querystring"}
    files = []
    for file in os.listdir(template_dir):
        if file.endswith((".yaml", ".yml")):
            files.append(file)
    success = True
    for file in files:
        with open("%s/%s" % (template_dir, file), "r") as stream:
            try:
                test = yaml.safe_load(stream)
            except yaml.YAMLError as err:
                print(err)
                exit(1)
            if required_headers.issubset(set(test.keys())):
                url = "%s/%s?%s" % (base_url, test["endpoint"], test["querystring"])
                req = Request(url)
                req.add_header("accept", "application/json")
                content = urlopen(req).read()
                data = json.loads(content)
                print(data)
                template = test["assert"]
                path = {}
                try:
                    assert is_subset(template, data, path)
                    print("    - %s: PASS" % file)
                except AssertionError:
                    print("    - %s: FAIL" % file)
                    success = False
                    print("      Test output:")
                    print(indent(yaml.dump(path), "          "))
    return success


def main():
    """Entry point."""
    args = docopt(__doc__)
    summary = {}
    global_outcome = "PASS"
    json_dirs = args.get("--json-test-dir", None)
    print("Running tests:")
    if json_dirs is not None:
        for json_dir in json_dirs:
            print(indent(json_dir, "  "))
            success = json_response_tests(args["--base-url"], json_dir)
            summary[json_dir] = success
    print()
    print("Summary:")
    for dir, success in summary.items():
        if success is True:
            outcome = "PASS"
        else:
            outcome = "FAIL"
            global_outcome = "FAIL"
        print("  %s: %s" % (dir, outcome))
    print()
    print("Outcome: %s" % global_outcome)
    if global_outcome == "FAIL":
        exit(1)


if __name__ == "__main__":
    main()
