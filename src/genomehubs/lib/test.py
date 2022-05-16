#!/usr/bin/env python3

"""
Test index and API responses.

Usage:
    genomehubs test [--taxonomy-source STRING] [--config-file YAML...]
                    [--base-url URL] --json-test-dir DIR...

Options:
    --config-file YAML          YAML configuration file.
    --base-url URL             GenomeHubs API base url. [Default: http://localhost:3000/api/v2]
    --json-test-dir DIR        Directory containing templates for json response tests.
    -h, --help                 Show this
    -v, --version              Show version number
"""


import json
import os
import re
import sys
from textwrap import indent
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.parse import unquote
from urllib.request import Request
from urllib.request import urlopen

import yaml
from docopt import docopt
from fastjsonschema import validate

from .config import config
from .version import __version__


def is_subset(a, b, path=None):
    """Test if a is a subset of b."""
    if path is None:
        path = {}

    def deep_unique(arr):
        """Test all items in b for uniqueness."""
        if isinstance(arr, list) and len(arr) > 1:
            for index, x in enumerate(arr[:-1]):
                for y in arr[index + 1:]:
                    if x == y:
                        return False
        return True

    def recursive_check_subset(a, b, path, *, invert=False):
        if isinstance(a, str):
            if a in b:
                path[a] = "FAIL" if invert else "PASS"
                yield True
            else:
                path[a] = "PASS" if invert else "FAIL"
                yield False
            return
        for x in a:
            if x == "not":
                path[x] = {}
                subset = next(recursive_check_subset(a[x], b, path[x], invert=True))
                yield not subset
            if x == "uniqueItems":
                if a[x] is True:
                    path[x] = {}
                    unique = deep_unique(b)
                    if invert:
                        unique = not unique
                    path[x] = "PASS" if unique else "FAIL"
                yield unique
            elif x == "jsonSchema":
                try:
                    validate(a[x], b)
                    path[x] = "FAIL" if invert else "PASS"
                    yield True
                except Exception:
                    path[x] = "PASS" if invert else "FAIL"
                    yield False
            elif isinstance(a[x], dict):
                if x in b:
                    path[x] = {}
                    yield all(recursive_check_subset(a[x], b[x], path[x]))
                else:
                    path[x] = False
                    yield path[x]
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
                elif x == "anyOf":
                    path[x] = {}
                    yield any([is_subset(entry, b, path[x]) for entry in a[x]])
                else:
                    status = (x in b) and (a[x] == b[x])
                    if invert:
                        path[x] = "FAIL" if status else "PASS"
                    else:
                        path[x] = "PASS" if status else "FAIL"
                    yield status

    return all(recursive_check_subset(a, b, path))


def placeholder_substitution(string, config):
    """Substitute placeholders with config values."""
    parts = re.split(r"(?:\{\{|\}\})", string)
    replaced = []
    for index, part in enumerate(parts):
        if index % 2 == 1:
            try:
                replaced.append(config[part])
            except KeyError:
                print("ERROR: no value for {{%s}} in configuration" % part)
        else:
            replaced.append(part)
    return "".join(replaced)


def json_response_tests(base_url, template_dir, opts):
    """Check yaml template is a subset of remote JSON object."""
    required_headers = {"assert", "endpoint"}
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
            raw_query = test.get("querystring", None)
            if required_headers.issubset(set(test.keys())):
                if raw_query is not None:
                    qs = {
                        unquote(entry.split("=")[0]): unquote(entry.split("=")[1])
                        for entry in test.get("querystring", "_").split("&")
                    }
                    querystring = "&".join(
                        [
                            "%s=%s" % (quote(key), quote(value))
                            for key, value in qs.items()
                        ]
                    )
                else:
                    querystring = ""
                endpoint = placeholder_substitution(test["endpoint"], opts)
                url = "%s/%s?%s" % (base_url, endpoint, querystring)
                req = Request(url)
                req.add_header("accept", "application/json")
                try:
                    content = urlopen(req).read()
                    data = json.loads(content)
                except HTTPError:
                    success = False
                    print("    - %s: FAIL" % file)
                    print("      Unable to open %s" % url)
                    continue
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
                    print(data)
    return success


def test_json_dir(json_dirs, base_url, opts):
    """Run tests in a JSON test dir."""
    if not base_url.startswith("http"):
        base_url = "http://%s" % base_url
    summary = {}
    global_outcome = "PASS"
    print("Running tests:")
    if json_dirs is not None:
        if not isinstance(json_dirs, list):
            json_dirs = [json_dirs]
        for json_dir in json_dirs:
            print(indent(json_dir, "  "))
            success = json_response_tests(base_url, json_dir, opts)
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
        return False
    return True


def main(args):
    """Entry point."""
    options = config("test", **args)
    json_dirs = args.get("--json-test-dir", None)
    result = test_json_dir(json_dirs, args["--base-url"], options["test"])

    if result is False:
        exit(1)


def cli():
    """Entry point."""
    if len(sys.argv) == sys.argv.index("test") + 1:
        args = docopt(__doc__, argv=[])
    else:
        args = docopt(__doc__, version=__version__)
    main(args)


if __name__ == "__main__":
    cli()
