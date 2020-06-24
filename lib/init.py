#!/usr/bin/env python3

"""
Initialise a GenomeHub.

Usage:
    genomehubs init [--directory PATH] [--insdc]
                    [--taxonomy-taxdump DIR] [--taxonomy-root TAXID...] [--configfile YAML...]
                    [--es-container STRING] [--es-host HOSTNAME] [--es-image STRING]
                    [--es-port PORT] [--es-repository STRING] [--es-startup-timeout STRING] [--use-docker]
                    [--reset] [--force-reset]

Options:
    --directory PATH          Root directory for new GenomeHub.
    --insdc                   Flag to index Public INSDC assemblies.
    --taxonomy-taxdump DIR    NCBI taxonomy taxdump directory.
    --taxonomy-root INT       Root taxid for taxonomy index.
    --configfile YAML         YAML configuration file.
    --es-container STRING     Elasticseach Docker container name.
    --es-host HOSTNAME        Elasticseach hostname/URL.
    --es-image STRING         Elasticseach Docker image name.
    --es-port PORT            Elasticseach port number.
    --es-repository STRING    Elasticseach Docker repository name.
    --es-startup-timeout INT  Time in seconds to wait for Elasticseach Docker container to start.
    --use-docker              Flag to use Docker to run Elasticsearch.
    --reset                   Flag to reset GenomeHub if already exists.
    --force-reset             Flag to force reset GenomeHub if already exists.

Examples:
    # 1. New GenomeHub with default settings
    ./genomehubs init

    # 2. New GenomeHub in specified directory, populated with Lepidoptera assemblies from INSDC
    ./genomehubs init --directory /path/to/GenomeHub --taxonomy-root 7088 --insdc
"""

import os
import platform
import shutil
import signal
import sys
import tarfile
import time
import urllib

from pathlib import Path
from subprocess import Popen, PIPE

import docker
import psutil
import requests

from docopt import docopt
from tqdm import tqdm
from elasticsearch import exceptions

import assembly
# import busco
# import fasta
import file_io
# import gff3
import gh_logger
import index
import insdc
import taxonomy
# import interproscan
from config import config
from es_functions import test_connection

LIBDIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ''))
LOGGER = gh_logger.logger()


def setup_directory(options):
    """Set up GenomeHubs directory."""
    if 'taxonomy' in options['init'] and 'taxdump' in options['init']['taxonomy']:
        Path(options['init']['taxonomy']['taxdump']).mkdir(parents=True, exist_ok=True)
    if 'directory' in options['init']:
        Path(options['init']['directory']).mkdir(parents=True, exist_ok=True)
    es_data = os.path.join(options['init']['directory'], 'elasticsearch', 'data')
    Path(es_data).mkdir(parents=True, exist_ok=True)
    options['init'].update({'es-data': es_data})
    es_logs = os.path.join(options['init']['directory'], 'elasticsearch', 'logs')
    Path(es_logs).mkdir(parents=True, exist_ok=True)
    options['init'].update({'es-logs': es_logs})


def start_elasticsearch_docker(options):
    """Use Elasticsearch Docker image."""
    docker_client = docker.from_env()
    docker_image = "%s/%s" % (options['init']['es-repository'], options['init']['es-image'])
    LOGGER.info("Pulling Elasticsearch Docker image from '%s'", docker_image)
    try:
        docker_client.images.pull(docker_image)
    except requests.exceptions.HTTPError:
        LOGGER.error("Unable to pull Docker image '%s' from '%s'",
                     options['init']['es-image'],
                     options['init']['es-repository'])
        sys.exit(1)
    LOGGER.info("Preparing Docker network '%s'", options['init']['docker-network'])
    try:
        docker_client.networks.get(options['init']['docker-network'])
    except docker.errors.NotFound:
        try:
            docker_client.networks.create(options['init']['docker-network'])
        except docker.errors.APIError:
            LOGGER.error("Unable to start Docker network")
            sys.exit(1)
    LOGGER.info("Starting Elasticsearch Docker container '%s'", docker_image)
    try:
        container = docker_client.containers.get(options['init']['es-container'])
    except docker.errors.NotFound:
        container = False
    if container:
        LOGGER.error("A container with the name '%s' already exists", options['init']['es-container'])
        mapped_ports = ','.join([obj[0]['HostPort'] for key, obj in container.ports.items()])
        LOGGER.info("Container with the same name running on port %s", mapped_ports)
        sys.exit(1)
    try:
        container = docker_client.containers.run(
            docker_image,
            name=options['init']['es-container'],
            network=options['init']['docker-network'],
            ports={'9200/tcp': int(options['init']['es-port'])},
            volumes={options['init']['es-data']: {'bind': '/usr/share/elasticsearch/data',
                                                  'mode': 'rw'}},
            restart_policy={'Name': 'always'},
            environment={'discovery.type': 'single-node',
                         'http.cors.enabled': 'true',
                         'http.cors.allow-origin': "*",
                         'http.cors.allow-headers':
                             'X-Requested-With,X-Auth-Token,Content-Type,Content-Length,Authorization',
                         'http.cors.allow-credentials': 'true'},
            detach=True)
        LOGGER.info('Starting Elasticsearch container')
        es = test_connection(options['init'], True)
        pbar = tqdm(total=int(options['init']['es-startup-timeout']))
        for _i in range(int(options['init']['es-startup-timeout'])):
            pbar.update(1)
            time.sleep(1)
            es = test_connection(options['init'], True)
            if es:
                break
        pbar.close()
        if es:
            LOGGER.info("Elasticsearch container running as '%s' on port %s",
                        options['init']['es-container'],
                        str(options['init']['es-port']))
            return es
        LOGGER.error("Unable to start Elasticsearch container in %s seconds",
                     str(options['init']['es-startup-timeout']))
        LOGGER.info('Consider increasing es-startup-timeout')
        LOGGER.info('Removing failed container')
        container.remove(force=True)
        sys.exit(1)
    except docker.errors.APIError:
        LOGGER.disabled = False
        LOGGER.error("Could not start Elasticsearch container")
        sys.exit(1)


def start_elasticsearch_binary(options):
    """Use Elasticsearch binary."""
    es_file = "%s-%s-%s.tar.gz" % (options['init']['es-image'].replace(':', '-'),
                                   platform.system().lower(),
                                   platform.machine())
    url = "%s/%s" % (options['init']['es-url'], es_file)
    gz_path = "%s/%s" % (options['init']['directory'], es_file)
    local_path = "%s/%s" % (options['init']['directory'], 'elasticsearch')
    es_dir = options['init']['es-image'].replace(':', '-').replace('-oss', '')
    es_path = "%s/%s" % (options['init']['directory'], es_dir)
    if not os.path.exists(es_path):
        if not os.path.exists(gz_path):
            LOGGER.info("Fetching Elasticsearch from '%s'", url)
            download_with_progress(url, gz_path)
        LOGGER.info("Extracting Elasticsearch to '%s'", es_path)
        archive = tarfile.open(gz_path, "r:gz")
        archive.extractall(local_path)
        archive.close()
    write_elastic_yaml("%s/config/elasticsearch.yml" % es_path, options)
    LOGGER.info("Starting Elasticsearch on port %s", options['init']['es-port'])
    process = Popen("%s/bin/elasticsearch" % es_path,
                    stdout=PIPE,
                    stderr=PIPE,
                    encoding='ascii')
    LOGGER.info("Starting Elasticsearch with pid %d", process.pid)
    es = test_connection(options['init'], True)
    pbar = tqdm(total=int(options['init']['es-startup-timeout']))
    for _i in range(int(options['init']['es-startup-timeout'])):
        pbar.update(1)
        time.sleep(1)
        es = test_connection(options['init'], True)
        if es:
            break
    pbar.close()
    if es:
        LOGGER.info("Elasticsearch running on port %s",
                    str(options['init']['es-port']))
        return es
    LOGGER.error("Unable to start Elasticsearch in %s seconds",
                 str(options['init']['es-startup-timeout']))
    LOGGER.info('Consider increasing es-startup-timeout')
    LOGGER.info('Stopping Elasticsearch process')
    try:
        os.kill(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    sys.exit(1)


def download_with_progress(url, file):
    """Display progress bar for file download."""
    res = requests.get(url, stream=True)
    total_size = int(res.headers.get('content-length', 0))
    block_size = 1024
    progress = tqdm(total=total_size, unit='iB', unit_scale=True)
    with open(file, 'wb') as fh:
        for data in res.iter_content(block_size):
            progress.update(len(data))
            fh.write(data)
    progress.close()


def write_elastic_yaml(path, options):
    """Write Elasticsearch YAML config file."""
    data = {
        'path.data': options['init']['es-data'],
        'path.logs': options['init']['es-logs'],
        'http.port': options['init']['es-port']
    }
    LOGGER.info('Writing Elasticsearch config')
    file_io.write_file(path, data)


def start_elasticsearch(options):
    """Start Elasticsearch."""
    es = test_connection(options['init'], True)
    if es:
        LOGGER.info("Elasticsearch is already running")
    if not es:
        if options['init']['es-host'] in {'localhost', '127.0.0.1'}:
            # Start Elasticsearch
            if options['init']['use-docker']:
                es = start_elasticsearch_docker(options)
            else:
                es = start_elasticsearch_binary(options)
        else:
            LOGGER.error('Unable to start Elasticsearch on remote host')
            LOGGER.info('Specify localhost or ensure Elasticsearch is running remotely before executing this command')
            sys.exit(1)
        # # Check Elasticsearch is running
        # es = test_connection(options['init'])
        if not es:
            LOGGER.error('Unable to start Elasticsearch')
            sys.exit(1)
    return es


def query_yes_no(question, default='no'):
    """Ask a yes/no question via raw_input() and return their answer.

    "question" is a string that is presented to the user.
    "default" is the presumed answer if the user just hits <Enter>.
        It must be "yes" (the default), "no" or None (meaning
        an answer is required of the user).

    The "answer" return value is True for "yes" or False for "no".
    """
    valid = {"yes": True, "y": True, "ye": True,
             "no": False, "n": False}
    if default is None:
        prompt = " [y/n] "
    elif default == "yes":
        prompt = " [Y/n] "
    elif default == "no":
        prompt = " [y/N] "
    else:
        raise ValueError("invalid default answer: '%s'" % default)

    while True:
        sys.stdout.write('\n' + question + prompt)
        choice = input().lower()
        if default is not None and choice == '':
            sys.stdout.write('\n')
            return valid[default]
        if choice in valid:
            sys.stdout.write('\n')
            return valid[choice]
        sys.stdout.write("Please respond with 'yes' or 'no' "
                         "(or 'y' or 'n').\n")


def directory_size(directory):
    """Calculate directory size."""
    if not Path(directory).is_dir():
        return False
    return sum(f.stat().st_size for f in Path(directory).glob('**/*') if f.is_file())


def human_readable_size(size, decimal_places=3):
    """Format file sizes."""
    for unit in ['B', 'KiB', 'MiB', 'GiB', 'TiB']:
        if size < 1024.0:
            break
        size /= 1024.0
    return f"{size:.{decimal_places}f}{unit}"


def reset_hub(options):  # pylint: disable=too-many-branches
    """Reset a GenomeHub by removing files and containers."""
    container = False
    elastic_process = False
    if 'use-docker' in options['init'] and options['init']['use-docker']:
        docker_client = docker.from_env()
        try:
            container = docker_client.containers.get(options['init']['es-container'])
        except docker.errors.NotFound:
            container = False
    else:
        exec_path = "%s/elasticsearch/elasticsearch" % options['init']['directory']
        for proc in psutil.process_iter():
            try:
                if proc.exe().startswith(exec_path):
                    elastic_process = proc
            except psutil.AccessDenied:
                pass
            except psutil.ZombieProcess:
                pass
    hub_size = directory_size(options['init']['directory'])
    if container or hub_size or elastic_process:
        if 'force-reset' in options['init'] and options['init']['force-reset']:
            proceed = True
        else:
            if container:
                LOGGER.warning("This will remove an existing container named '%s' ", options['init']['es-container'])
            elif elastic_process:
                LOGGER.warning("This will remove an existing Elasticsearch process with pid '%d' ", elastic_process.pid)
            if hub_size:
                LOGGER.warning("This will remove an existing directory at '%s'", options['init']['directory'])
            if hub_size:
                LOGGER.warning("The directory contains %s data", human_readable_size(hub_size))
            proceed = query_yes_no('Do you wish to proceed?')
    else:
        LOGGER.warning("Could not find an existing GenomeHub to remove")
        return False
    if proceed:
        if container:
            LOGGER.info("Removing container named '%s'", options['init']['es-container'])
            container.remove(force=True)
        if elastic_process:
            LOGGER.info("Removing Elasticsearch process with pid '%d'", elastic_process.pid)
            elastic_process.terminate()
        if hub_size:
            LOGGER.info("Removing directory '%s'", options['init']['directory'])
            shutil.rmtree(Path(options['init']['directory']))
        return True
    LOGGER.info("Reset aborted, keeping existing GenomeHub")
    return False


def fetch_taxdump(options):
    """Fetch and extract NCBI taxdump files."""
    dir_name = options['init']['taxonomy-taxdump']
    if Path(os.path.join(dir_name, 'nodes.dmp')).is_file():
        LOGGER.info("Using existing NCBI taxdump at %s", dir_name)
        return
    url = options['init']['taxonomy-url']
    LOGGER.info("Fetching NCBI taxdump from %s", url)
    file_tmp = urllib.request.urlretrieve(url, filename=None)[0]
    tar = tarfile.open(file_tmp)
    LOGGER.info("Extracting NCBI taxdump to %s", dir_name)
    tar.extractall(dir_name)
    LOGGER.info('Finished extracting NCBI taxdump')
    return


def index_taxonomy(es, options):
    """Call genomehubs index --taxonomy unless index already exists."""
    try:
        index_name = taxonomy.template('name', options['init'])
        es.indices.get(index_name)
        LOGGER.info("Using existing taxonomy index '%s'", index_name)
    except exceptions.NotFoundError:
        index.load_template(es, taxonomy.template())
        LOGGER.info("Initialising taxonomy index '%s'", index_name)
        index.index_entries(es, index_name, taxonomy, {**options['index'], **options['init']})


def index_insdc(es, options):
    """Call genomehubs index --insdc unless index already exists."""
    try:
        index_name = assembly.template('name', options['init'])
        es.indices.get(index_name)
        LOGGER.info("Using existing assembly index '%s'", index_name)
    except exceptions.NotFoundError:
        index.load_template(es, insdc.template())
        LOGGER.info("Initialising assembly index '%s' with public INSDC assemblies",
                    index_name)
        index.index_entries(es, index_name, insdc, {**options['index'], **options['init']})


def main():
    """Entrypoint for genomehubs search."""
    args = docopt(__doc__)

    # Load configuration options
    options = config('init', **args)

    # Reset an existing hub?
    if 'reset' in options['init'] and options['init']['reset']:
        reset_hub(options)

    # Create GenomeHubs directory
    setup_directory(options)

    # Start Elasticsearch
    es = start_elasticsearch(options)

    # Fetch NCBI taxdump
    fetch_taxdump(options)

    # Index taxonomy
    if 'taxonomy-root' in options['init'] and options['init']['taxonomy-root']:
        index_taxonomy(es, options)

    # Index INSDC
    if 'insdc' in options['init'] and options['init']['insdc']:
        index_insdc(es, options)


if __name__ == '__main__':
    main()
