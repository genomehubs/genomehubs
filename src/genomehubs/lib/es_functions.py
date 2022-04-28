#!/usr/bin/env python3
"""Elasticsearch functions."""

import logging
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
from elasticsearch import NotFoundError
from elasticsearch import client
from elasticsearch import helpers
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
                hosts=hosts, timeout=1800, max_retries=10, retry_on_timeout=True
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
        "Unable to start ElasticSearch in %d seconds",
        int(opts["es-timeout"]),
    )
    LOGGER.info("Consider increasing es-timeout")
    LOGGER.info("Stopping ElasticSearch process")
    try:
        os.kill(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    sys.exit(1)


def launch_es(opts, log=True):
    """Launch ElasticSearch."""
    es = test_connection(opts)
    if es:
        if log:
            LOGGER.info("ElasticSearch is already running")
    if not es:
        if any(host.startswith(("localhost", "127.0.0.1")) for host in opts["es-host"]):
            # Start Elasticsearch
            if "docker-contain" in opts and "es" in opts["docker-contain"]:
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
    """Test if Elasticsearch index exists."""
    es_client = client.IndicesClient(es)
    with tolog.DisableLogger():
        res = es_client.exists(index_name)
    return res


def index_create(es, index_name):
    """Create an Elasticsearch index if it does not already exist."""
    es_client = client.IndicesClient(es)
    res = index_exists(es, index_name)
    if not res:
        with tolog.DisableLogger():
            res = es_client.create(index_name)
    return res


def load_mapping(es, mapping_name, mapping):
    """Load index mapping template into Elasticsearch."""
    es_client = client.IndicesClient(es)
    with tolog.DisableLogger():
        res = es_client.put_template(name=mapping_name, body=mapping)
    return res


def index_stream(es, index_name, stream, *, _op_type="index", log=True, dry_run=False):
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

    def dry_run_iterator(es, actions):
        """Alternate iterator for dry run."""
        for action in actions:
            yield True, {}

    try:
        tracer = logging.getLogger("elasticsearch")
        tracer.setLevel(logging.ERROR)
        if dry_run:
            iterator = dry_run_iterator(es, actions)
        else:
            iterator = helpers.streaming_bulk(es, actions)
        success = 0
        failed = 0
        if log:
            iterator = tqdm(iterator, unit=" records", unit_scale=True)
        for ok, response in iterator:
            if ok:
                success += 1
            else:
                failed += 1
    except Exception as err:
        raise err
    es_client = client.IndicesClient(es)
    es_client.refresh(index=index_name)
    return success, failed


def stream_template_search_results(es, *, index, body, size=10):
    """Stream results of a template search."""
    body["params"].update({"size": size})
    with tolog.DisableLogger():
        res = es.search_template(
            index=index, body=body, rest_total_hits_as_int=True, scroll="90m"
        )
    scroll_id = res["_scroll_id"]
    count = res["hits"]["total"]
    for hit in res["hits"]["hits"]:
        yield hit
    offset = size
    while offset < count:
        with tolog.DisableLogger():
            res = es.scroll(
                rest_total_hits_as_int=True, scroll="90m", scroll_id=scroll_id
            )
        for hit in res["hits"]["hits"]:
            yield hit
        offset += size
    with tolog.DisableLogger():
        es.clear_scroll(scroll_id=scroll_id)


def query_flexible_template(es, template_name, index, opts=None):
    """Run query using a flexible template."""
    if not index_exists(es, index):
        return None
    if opts is None:
        return None
    body = ujson.dumps({"id": template_name, "params": opts})
    body += "\n"
    res = None
    with tolog.DisableLogger():
        res = es.search_template(body=body, index=index)
    return res


def query_keyword_value_template(es, template_name, keyword, values, index, opts=None):
    """Run query using a by_keyword_value template."""
    if not index_exists(es, index):
        return None
    if opts is None:
        opts = {"keyword": "keyword", "value": "value"}
    multisearch = False
    body = ""
    if isinstance(values, list):
        multisearch = True
    else:
        values = [values]
    for value in values:
        if multisearch:
            body += "{}\n"
        body += ujson.dumps(
            {
                "id": template_name,
                "params": {opts["keyword"]: keyword, opts["value"]: value},
            }
        )
        body += "\n"
    res = None
    if multisearch:
        with tolog.DisableLogger():
            res = es.msearch_template(body=body, index=index)
    else:
        with tolog.DisableLogger():
            res = es.search_template(body=body, index=index)
    return res


def query_value_template(es, template_name, values, index):
    """Run query using a by_value template."""
    if not index_exists(es, index):
        return None
    multisearch = False
    body = ""
    if isinstance(values, list):
        multisearch = True
    else:
        values = [values]
    if not values:
        return None
    for value in values:
        if multisearch:
            body += "{}\n"
        body += ujson.dumps({"id": template_name, "params": {"value": value}})
        body += "\n"
    res = None
    if multisearch:
        with tolog.DisableLogger():
            res = es.msearch_template(body=body, index=index)
    else:
        with tolog.DisableLogger():
            res = es.search_template(body=body, index=index)
    return res


def document_by_id(es, ids, index):
    """Get indexed documents by ID."""
    if not index_exists(es, index):
        return None
    multisearch = False
    if not ids:
        return None
    if isinstance(ids, list):
        multisearch = True
    res = None
    try:
        if multisearch:
            with tolog.DisableLogger():
                res = es.mget(body={"ids": ids}, index=index)
                ret = {}
                for result in res["docs"]:
                    if "found" in result and result["found"]:
                        ret.update({result["_id"]: result["_source"]})
                res = ret
        else:
            with tolog.DisableLogger():
                res = es.get(id=ids, index=index)
                if "found" in res and res["found"]:
                    res = {res["_id"]: res["_source"]}
                else:
                    res = None
    except NotFoundError:
        res = None
    return res


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
