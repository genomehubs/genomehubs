#!/usr/bin/env python3
"""Elasticsearch functions."""

import os
import platform
import signal
import sys
import time
from pathlib import Path
from subprocess import PIPE
from subprocess import Popen

import ujson
from elasticsearch import Elasticsearch
from elasticsearch import client
from elasticsearch import helpers
from tolkein import tofetch
from tolkein import tofile
from tolkein import tolog
from tqdm import tqdm

LOGGER = tolog.logger(__name__)


def test_connection(opts, *, log=False):
    """Test connection to Elasticsearch."""
    connected = False
    hosts = opts["es-host"]
    with tolog.DisableLogger():
        try:
            es = Elasticsearch(
                hosts=hosts, timeout=30, max_retries=10, retry_on_timeout=True
            )
            connected = es.info()
        except Exception:
            pass
    if not connected:
        message = "Could not connect to Elasticsearch at '%s'" % ", ".join(hosts)
        if log:
            LOGGER.error(message)
            sys.exit(1)
        return False
    if log:
        LOGGER.info("Connected to Elasticsearch")
    return es


def write_elastic_yaml(path, opts):
    """Write Elasticsearch YAML config file."""
    try:
        port = int(opts["es-host"][0].split(":")[1])
    except ValueError:
        port = 9200
    Path("%s/data" % opts["es-path"]).mkdir(parents=True, exist_ok=True)
    Path("%s/logs" % opts["es-path"]).mkdir(parents=True, exist_ok=True)
    data = {
        "path.data": "%s/data" % opts["es-path"],
        "path.logs": "%s/logs" % opts["es-path"],
        "http.port": port,
    }
    tofile.write_file(path, data)
    return port


def start_es_docker(opts):
    """Use Elasticsearch Docker image."""
    LOGGER.error("Elasticsearch Docker options have not been implemented yet")
    return None


def start_es_binary(opts):
    """Use ElasticSearch binary."""
    es_full_version = "%s-%s-%s" % (
        opts["es-version"],
        platform.system().lower(),
        platform.machine(),
    )
    es_tarfile = "%s.tar.gz" % es_full_version
    es_bin_path = Path(opts["es-path"]) / opts["es-version"].replace("-oss", "") / "bin"
    if not es_bin_path.exists():
        es_url = "%s/%s" % (opts["es-url"], es_tarfile)
        LOGGER.info("Fetching ElasticSearch from '%s'", es_url)
        members = tofetch.fetch_tar(es_url, opts["es-path"])
        print(members)
    LOGGER.info("Writing ElasticSearch config")
    port = write_elastic_yaml("%s/config/elasticsearch.yml" % opts["es-path"], opts)
    LOGGER.info("Starting ElasticSearch on port %d", port)
    process = Popen(
        "%s/elasticsearch" % es_bin_path, stdout=PIPE, stderr=PIPE, encoding="ascii"
    )
    LOGGER.info("Starting ElasticSearch with pid %d", process.pid)
    es = test_connection(opts)
    pbar = tqdm(total=int(opts["es-timeout"]))
    for _i in range(int(opts["es-timeout"])):
        pbar.update(1)
        time.sleep(1)
        es = test_connection(opts)
        if es:
            break
    pbar.close()
    if es:
        LOGGER.info("ElasticSearch running on port %d", port)
        return es
    LOGGER.error(
        "Unable to start ElasticSearch in %d seconds", int(opts["es-timeout"]),
    )
    LOGGER.info("Consider increasing es-timeout")
    LOGGER.info("Stopping ElasticSearch process")
    try:
        os.kill(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    sys.exit(1)


def launch_es(opts):
    """Launch ElasticSearch."""
    es = test_connection(opts)
    if es:
        LOGGER.info("ElasticSearch is already running")
    if not es:
        if any(host.startswith(("localhost", "127.0.0.1")) for host in opts["es-host"]):
            # Start Elasticsearch
            if "es" in opts["docker-contain"]:
                es = start_es_docker(opts)
            else:
                es = start_es_binary(opts)
        else:
            LOGGER.error("Unable to start ElasticSearch on remote host")
            LOGGER.info(
                "Specify localhost or ensure ElasticSearch is running remotely before executing this command"
            )
            sys.exit(1)
        if not es:
            LOGGER.error("Unable to start ElasticSearch")
            sys.exit(1)
    return es


def index_exists(es, index_name):
    """Load index mapping template into Elasticsearch."""
    es_client = client.IndicesClient(es)
    with tolog.DisableLogger():
        res = es_client.exists(index_name)
    return res


def load_mapping(es, mapping_name, mapping):
    """Load index mapping template into Elasticsearch."""
    es_client = client.IndicesClient(es)
    res = es_client.put_template(name=mapping_name, body=mapping)
    return res


def index_stream(es, index_name, stream, *, _op_type="index"):
    """Load bulk entries from stream into Elasticsearch index."""
    # LOGGER.info("Indexing bulk entries to %s", index_name)
    if _op_type == "index":
        actions = (
            {
                "_index": index_name,
                "_id": entry_id,
                "_source": entry,
                "_op_type": _op_type,
            }
            for entry_id, entry in stream
        )
    elif _op_type == "update":
        actions = (
            {"_index": index_name, "_id": entry_id, "doc": entry, "_op_type": _op_type}
            for entry_id, entry in stream
        )
    with tolog.DisableLogger():
        try:
            iterator = helpers.streaming_bulk(es, actions)
            iterator = tqdm(iterator, unit=" records", unit_scale=True)
            success = 0
            failed = 0
            for ok, response in iterator:
                if ok:
                    success += 1
                else:
                    failed += 1
        except Exception as err:
            raise err

    # if success and success > 0:
    #     LOGGER.info("Indexed %d entries", success)
    return success, failed


class EsQueryBuilder:
    """Class for building ElasticSearch queries."""

    def __init__(self):
        """Init EsQueryBuilder class."""
        self._parts = []
        self._includes = []
        self._excludes = []
        self._query = {}
        return None

    def es_and(self):
        """AND query."""
        self.es_bool()
        return self

    def es_or(self):
        """OR query."""
        self.es_bool("should")
        return self

    def es_bool(self, bool_type="filter"):
        """Bool query."""
        obj = {"bool": {bool_type: self._parts[:]}}
        self._parts = [obj]
        return self

    def es_nested(self, path, bool_type="filter"):
        """Nested query."""
        self.es_bool(bool_type)
        obj = {"nested": {"path": path, "query": self._parts[0]}}
        self._parts = [obj]
        return self

    def es_nested_or(self, path):
        """Nested query."""
        self.es_nested(path, bool_type="filter")
        return self

    def es_nested_and(self, path):
        """Nested query."""
        self.es_nested(path)
        return self

    def es_range(self, key, limits, *, inclusive=True):
        """Range query."""
        obj = {}
        if isinstance(limits, list):
            if limits[0] is not None:
                if inclusive:
                    obj.update({"gte": limits[0]})
                else:
                    obj.update({"gt": limits[0]})
            if len(limits) > 1 and limits[1] is not None:
                if inclusive:
                    obj.update({"lte": limits[1]})
                else:
                    obj.update({"lt": limits[1]})
        else:
            obj.update({"gte": limits[0], "lte": limits[1]})
        self._parts.append({"range": {key: obj}})
        return self

    def es_match(self, key, value):
        """Match query."""
        self._parts.append({"match": {key: str(value)}})
        return self

    def es_include(self, keys):
        """Add fields to include list."""
        if not isinstance(keys, list):
            keys = [keys]
        for key in keys:
            if key not in self._includes:
                self._includes.append(key)
        return self

    def es_exclude(self, keys):
        """Add fields to exclude list."""
        if not isinstance(keys, list):
            keys = [keys]
        for key in keys:
            if key not in self._excludes:
                self._excludes.append(key)
        return self

    def write(self):
        """Return query."""
        if self._parts:
            if len(self._parts) > 1:
                self.es_bool()
            query = {"query": self._parts[0]}
            source = {}
            if self._includes:
                source.update({"includes": self._includes})
            if self._excludes:
                source.update({"excludes": self._excludes})
            if source:
                query.update({"_source": source})
            return query
        return None

    def string(self):
        """Return query as string."""
        return ujson.dumps(self.write())
