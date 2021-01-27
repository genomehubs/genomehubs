#!/usr/bin/env python3

"""File indexing methods."""

import hashlib
import os
from datetime import date
from mimetypes import guess_type
from pathlib import Path
from shutil import copyfile

import filetype
from PIL import Image
from tolkein import tofetch
from tolkein import tofile
from tolkein import tolog

from .analysis import index_template as analysis_index_template
from .es_functions import document_by_id
from .es_functions import index_stream
from .hub import index_templator

LOGGER = tolog.logger(__name__)

TODAY = date.today().strftime("%Y-%m-%d")


def index_template(taxonomy_name, opts):
    """Index template (includes name, mapping and types)."""
    parts = ["file", taxonomy_name, opts["hub-name"], opts["hub-version"]]
    template = index_templator(parts, opts)
    return template


def force_copy(sourcename, destname, symlink=True):
    """Create or replace a symlink to a file."""
    localfile = Path(destname)
    os.makedirs(Path(destname).parent, exist_ok=True)
    try:
        localfile.unlink()
    except FileNotFoundError:
        pass
    if symlink:
        localfile.symlink_to(Path(sourcename))
    else:
        copyfile(Path(sourcename), localfile)


def process_image_file(infile, filename, opts, *, dest_dir="./", attrs=None):
    """Process an image file for indexing."""
    if attrs is None:
        attrs = {}
    filepath = Path(filename)
    dimensions = (100, 100)
    thumbname = "%s.thm%s" % (filepath.stem, filepath.suffix)
    with Image.open(infile) as im:
        attrs.update(
            {
                "thumb_name": thumbname,
                "format": im.format,
                "size_pixels": "%sx%s" % (im.width, im.height),
            }
        )
        if filename != thumbname:
            try:
                im.thumbnail(dimensions)
                im.save("%s/%s/%s" % (opts["hub-path"], dest_dir, thumbname))
            except OSError:
                LOGGER.warn("Cannot create thumbnail for '%s'", infile)
        attrs.update()
    return attrs


def set_file_meta_defaults(opts):
    """Set default values for file metadata."""
    defaults = {}
    for key in {
        "taxon-id",
        "assembly-id",
        "analysis-id",
        "file-title",
        "file-description",
    }:
        value = opts.get(key, False)
        if value:
            defaults.update({key.replace("file-", "").replace("-", "_"): value})
    return defaults


def process_file(
    infile,
    opts,
    *,
    file_template=None,
    analysis_template=None,
    filename=None,
    meta=None,
    local="symlink"
):
    """Process a file for indexing."""
    filepath = Path(infile)
    if filename is None:
        filename = filepath.name
    if meta is None:
        meta = {}
    attrs = {
        "name": filename,
        "size_bytes": os.path.getsize(infile),
        **set_file_meta_defaults(opts),
        **meta,
    }
    try:
        dest_dir = str(filepath.parent.relative_to(opts["hub-path"]))
    except ValueError:
        dest_dir = "files"
        dest_dir += "/taxon-" + attrs.get("taxon_id", "all")
        dest_dir += "/assembly-" + attrs.get("assembly_id", "all")
        dest_dir += "/analysis-" + attrs.get("analysis_id", "all")
        localname = "%s/%s/%s" % (opts["hub-path"], dest_dir, filename)
        if local == "symlink":
            force_copy(infile, localname)
        elif local == "copy":
            force_copy(infile, localname, False)
    attrs.update({"location": dest_dir})
    kind = filetype.guess(infile)
    if kind is not None:
        attrs.update({"extension": kind.extension, "mime_type": kind.mime})
        if filetype.is_image(infile):
            process_image_file(infile, filename, opts, dest_dir=dest_dir, attrs=attrs)
    else:
        attrs.update({"extension": filepath.suffix.replace(".", "")})
        attrs.update({"mime_type": guess_type(filepath)[0]})
    file_props = file_template["mapping"]["mappings"]["properties"].keys()
    analysis_props = analysis_template["mapping"]["mappings"]["properties"].keys()
    file_attrs = {}
    analysis_attrs = {}
    # split attrs into 2 sets for indexing
    for key, value in attrs.items():
        if key in file_props:
            file_attrs.update({key: value})
            if key == "analysis_id":
                analysis_attrs.update({key: value})
        elif key in analysis_props:
            analysis_attrs.update({key: value})
        elif key == "analysis":
            for sub_key, sub_value in value.items():
                if sub_key in analysis_props:
                    analysis_attrs.update({sub_key: sub_value})
    file_location = "%s/%s" % (file_attrs["location"], file_attrs["name"])
    file_attrs.update(
        {"file_id": hashlib.md5(file_location.encode("utf-8")).hexdigest()}
    )
    if not file_attrs.get("date_created", False):
        file_attrs.update({"date_created": TODAY})
    if "url" in file_attrs:
        file_attrs.update({"date_accessed": TODAY})
    return file_attrs, analysis_attrs


def index_files(es, files, taxonomy_name, opts):
    """Index files."""
    file_template = index_template(taxonomy_name, opts)
    analysis_template = analysis_index_template(taxonomy_name, opts)
    for infile in files:
        LOGGER.info("Indexing %s", infile)
        p = Path(infile)
        if p.is_dir():
            LOGGER.warn(
                "Argument to --file must be a valid file path. '%s' is a directory",
                infile,
            )
            continue
        file_attrs, analysis_attrs = process_file(
            infile,
            opts,
            file_template=file_template,
            analysis_template=analysis_template,
        )


def update_analysis_attributes(es, analyses, analysis_attrs, analysis_template):
    """Update analysis attributes ready for reindexing."""
    analysis_id = "analysis_id-%s" % analysis_attrs["analysis_id"]
    action = "index"
    if analysis_id not in analyses:
        res = document_by_id(es, analysis_id, analysis_template["index_name"],)
        if res is not None and analysis_id in res:
            analyses.update({analysis_id: res[analysis_id]})
    if analysis_id in analyses:
        action = "update"
        taxon_id = analysis_attrs.get("taxon_id", None)
        assembly_id = analysis_attrs.get("assembly_id", None)
        if (
            analyses[analysis_id].get("taxon_id", taxon_id) != taxon_id
            or analyses[analysis_id].get("assembly_id", assembly_id) != assembly_id
        ):
            LOGGER.warning(
                "taxon/assembly ID mismatch for %s, unable to import %s",
                analysis_id,
                analysis_attrs.get("name", None),
            )
            return False
        LOGGER.info("Updating %s", analysis_id)
        # update analysis
        for key, value in analysis_attrs.items():
            if value != "":
                if key not in analyses[analysis_id]:
                    analyses[analysis_id].update({key: value})
                elif value != analyses[analysis_id][key]:
                    LOGGER.info(
                        "Updating %s value for %s to '%s'", key, analysis_id, value
                    )
    else:
        analyses[analysis_id] = {}
        for key, value in analysis_attrs.items():
            if value != "":
                analyses[analysis_id].update({key: value})
        # set file counter
        analyses[analysis_id].update({"file_count": 0})
    return action


def update_file_attributes(es, files, file_attrs, analyses, file_template):
    """Update file attributes ready for reindexing."""
    file_id = "file_id-%s" % file_attrs["file_id"]
    action = "index"
    if file_id not in files:
        res = document_by_id(es, file_id, file_template["index_name"],)
        if res is not None and file_id in res:
            files.update({file_id: res[file_id]})
    if file_id in files:
        action = "update"
        analysis_id = file_attrs.get("analysis_id", None)
        if files[file_id].get("analysis_id", analysis_id) != analysis_id:
            LOGGER.warning(
                "analysis ID mismatch for %s, unable to import %s",
                file_id,
                file_attrs.get("name", None),
            )
            return False
        LOGGER.info("Updating %s", file_id)
        # update analysis
        for key, value in file_attrs.items():
            if value != "":
                if key not in files[file_id]:
                    files[file_id].update({key: value})
                elif value != files[file_id][key]:
                    LOGGER.info("Updating %s value for %s to '%s'", key, file_id, value)
    else:
        files[file_id] = {}
        for key, value in file_attrs.items():
            if value != "":
                files[file_id].update({key: value})
        analyses["analysis_id-%s" % file_attrs["analysis_id"]]["file_count"] += 1
    return action


def stream_docs(doc_dict):
    """Stream a dict of docs."""
    for doc_id, doc in doc_dict.items():
        yield doc_id, doc


def index_docs(es, doc_collection, template):
    """Index a collection of docs."""
    for op_type, doc_dict in doc_collection.items():
        if doc_dict:
            docs = stream_docs(doc_dict)
            index_stream(
                es, template["index_name"], docs, _op_type=op_type,
            )


def index_metadata(es, file, taxonomy_name, opts):
    """Index file metadata."""
    data = tofile.load_yaml(file)
    file_template = index_template(taxonomy_name, opts)
    analysis_template = analysis_index_template(taxonomy_name, opts)
    if data is None:
        LOGGER.warn("Unable to load file metadata from '%s'" % file)
        return
    analyses = {}
    files = {}
    analysis_docs = {"index": {}, "update": {}}
    file_docs = {"index": {}, "update": {}}
    for meta in data:
        local = "symlink"
        if "path" in meta:
            if meta["path"].startswith("~"):
                infile = os.path.expanduser(meta["path"])
            else:
                infile = meta["path"]
            del meta["path"]
        elif "url" in meta:
            infile = tofetch.fetch_tmp_file(meta["url"])
            local = None
        elif "name" in meta:
            infile = meta["name"]
        else:
            LOGGER.warn("Found a record with no associated file in '%s'" % file)
        if "name" in meta:
            filename = meta["name"]
            del meta["name"]
        else:
            filename = None
        local = meta.pop("local", local)
        file_attrs, analysis_attrs = process_file(
            infile,
            opts,
            file_template=file_template,
            analysis_template=analysis_template,
            filename=filename,
            meta=meta,
            local=local,
        )
        # TODO: #30 check taxon_id(s) and assembly_id(s) exist in database
        # Fetch existing analysis entry if available
        action = update_analysis_attributes(
            es, analyses, analysis_attrs, analysis_template
        )
        if not action:
            continue
        analysis_id = "analysis_id-%s" % analysis_attrs["analysis_id"]
        if analysis_id in analysis_docs["index"]:
            action = "index"
        analysis_docs[action].update({analysis_id: analyses[analysis_id]})
        # preparare files for indexing (include check for dupes and increment analysis file count)
        file_action = update_file_attributes(
            es, files, file_attrs, analyses, file_template
        )
        if not file_action:
            continue
        file_id = "file_id-%s" % file_attrs["file_id"]
        if analysis_id in analysis_docs["index"]:
            action = "index"
        file_docs[file_action].update({file_id: files[file_id]})
    # Create/update index entry according to returned action
    LOGGER.info("Indexing analyses")
    index_docs(es, analysis_docs, analysis_template)
    LOGGER.info("Indexing files")
    index_docs(es, file_docs, file_template)
