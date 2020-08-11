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

from elasticsearch import Elasticsearch
from elasticsearch import client
from elasticsearch import helpers
from tqdm import tqdm

from tolkein import tofetch
from tolkein import tofile
from tolkein import tolog

LOGGER = tolog.logger(__name__)


def test_connection(opts, *, log=False):
    """Test connection to Elasticsearch."""
    connected = False
    hosts = opts["es-host"]
    with tolog.DisableLogger():
        try:
            es = Elasticsearch(hosts=hosts)
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


def load_mapping(es, mapping_name, mapping):
    """Load index mapping template into Elasticsearch."""
    es_client = client.IndicesClient(es)
    res = es_client.put_template(name=mapping_name, body=mapping)
    return res


def index_stream(es, index_name, stream):
    """Load bulk entries from stream into Elasticsearch index."""
    LOGGER.info("Indexing bulk entries to %s", index_name)
    with tolog.DisableLogger():
        actions = (
            {
                "_index": index_name,
                "_id": entry_id,
                "_source": entry,
                "_op_type": "index",
            }
            for entry_id, entry in stream
        )
    success, failed = helpers.bulk(es, actions, stats_only=True)
    if success and success > 0:
        LOGGER.info("Indexed %d entries", success)
    return success, failed
