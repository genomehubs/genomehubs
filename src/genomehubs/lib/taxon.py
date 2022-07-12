#!/usr/bin/env python3

"""Taxon methods."""

import sys
from collections import defaultdict

from tolkein import tolog
from tqdm import tqdm

from .es_functions import EsQueryBuilder
from .es_functions import document_by_id
from .es_functions import index_stream
from .es_functions import query_keyword_value_template
from .es_functions import query_value_template
from .es_functions import stream_template_search_results
from .hub import add_attribute_values
from .hub import chunks
from .hub import index_templator
from .hub import write_imported_rows
from .taxonomy import index_template as taxonomy_index_template

LOGGER = tolog.logger(__name__)


def index_template(taxonomy_name, opts):
    """Index template (includes name, mapping and types)."""
    parts = ["taxon", taxonomy_name, opts["hub-name"], opts["hub-version"]]
    template = index_templator(parts, opts)
    return template


def lookup_taxon_by_taxid(es, taxon_id, taxonomy_template):
    """Lookup taxon in taxonomy index by taxon_id."""
    query = EsQueryBuilder()
    query.es_match("taxon_id", taxon_id)
    with tolog.DisableLogger():
        res = es.search(index=taxonomy_template["index_name"], body=query.write())
    if res["hits"]["total"]["value"] == 1:
        return res["hits"]["hits"][0]["_source"]
    return None


def lookup_taxa_by_taxon_id(es, values, template, *, return_type="list"):
    """Retrieve existing taxa from index."""
    taxa = []
    if return_type == "dict":
        taxa = {}
    res = document_by_id(
        es, ["taxon-%s" % value for value in values], template["index_name"]
    )
    if res is not None:
        if return_type == "list":
            taxa = [key.replace("taxon-", "") for key in res.keys()]
        else:
            for key, source in res.items():
                taxon_id = key.replace("taxon-", "")
                taxa.update({taxon_id: {"_id": key, "_source": source}})
    # taxon_res = query_keyword_value_template(
    #     es,
    #     "attributes_names_by_keyword_value",
    #     "taxon_id",
    #     values,
    #     index=template["index_name"],
    # )
    # if taxon_res is not None:
    #     for response in taxon_res["responses"]:
    #         if "hits" in response and response["hits"]["total"]["value"] == 1:
    #             if return_type == "list":
    #                 taxa.append(response["hits"]["hits"][0])
    #             else:
    #                 taxa[response["hits"]["hits"][0]["_source"]["taxon_id"]] = response[
    #                     "hits"
    #                 ]["hits"][0]
    #         elif return_type == "list":
    #             taxa.append(None)
    return taxa


def lookup_missing_taxon_ids(
    es,
    without_ids,
    opts,
    *,
    with_ids=None,
    blanks=set(["NA", "None"]),
    spellings=None,
    taxon_table=None,
):
    """Lookup taxon ID based on available taxonomic information."""
    if with_ids is None:
        with_ids = {}
    if spellings is None:
        spellings = {"spellcheck": {}, "synonym": {}}
    # TODO: set this list from types file
    ranks = [
        "subspecies",
        "species",
        "genus",
        "family",
        "order",
        "class",
        "subphylum",
        "phylum",
    ]
    found_keys = []
    pbar = tqdm(total=len(without_ids.keys()))
    for key, arr in without_ids.items():
        pbar.update(1)
        for obj in arr:
            if "taxonomy" not in obj:
                continue
            for index, rank in enumerate(ranks):
                if rank not in obj["taxonomy"] or obj["taxonomy"][rank] in blanks:
                    continue
                taxa, name_class = lookup_taxon(
                    es,
                    obj["taxonomy"][rank],
                    opts,
                    rank=rank,
                    return_type="taxon",
                    spellings=spellings,
                    taxon_table=taxon_table,
                    taxonomy=obj["taxonomy"]
                )
                if index == 1 and not taxa:
                    break
                if len(taxa) == 1:
                    obj.update({"input_name": obj["taxonomy"][rank]})
                    taxon = taxa[0]["_source"]
                    if obj["taxonomy"][rank] != taxon["scientific_name"]:
                        spellings["synonym"].update(
                            {
                                obj["taxonomy"][rank]: {
                                    "matches": [taxon["scientific_name"]],
                                    "taxon_id": taxon["taxon_id"],
                                    "rank": rank,
                                }
                            }
                        )
                    if taxon["taxon_id"] in with_ids:
                        with_ids[taxon["taxon_id"]].append(obj)
                    else:
                        obj["attributes"] = [obj["attributes"]]
                        with_ids[taxon["taxon_id"]] = [obj]
                        LOGGER.debug(
                            "Matched %s with taxon_id %s",
                            obj["taxonomy"][rank],
                            taxon["taxon_id"],
                        )
                    found_keys.append(key)
                break
                # TODO: Allow lookup for higher taxa
                # if not taxon_ids:
                #     continue
                for anc_rank in ranks[(index + 1) :]:
                    if (
                        anc_rank not in obj["taxonomy"]
                        or obj["taxonomy"][anc_rank] in blanks
                    ):
                        continue
                    taxon_ids = lookup_taxon_within_lineage(
                        es,
                        obj["taxonomy"][rank],
                        obj["taxonomy"][anc_rank],
                        opts,
                        rank=rank,
                        anc_rank=anc_rank,
                        return_type="taxon_id",
                        name_class=name_class,
                    )
                    if taxon_ids:
                        if len(taxon_ids) == 1:
                            if taxon_ids[0] in with_ids:
                                with_ids[taxon_ids[0]].append(obj)
                            else:
                                obj["attributes"] = [obj["attributes"]]
                                with_ids[taxon_ids[0]] = [obj]
                                LOGGER.debug(
                                    "Matched %s with taxon_id %s",
                                    obj["taxonomy"][rank],
                                    taxon_ids[0],
                                )
                            found_keys.append(key)
                        else:
                            LOGGER.warn(
                                "Taxon name %s is ambiguous within %s",
                                obj["taxonomy"][rank],
                                obj["taxonomy"][anc_rank],
                            )
                        break
                break
    pbar.close()
    found_ids = {taxon_id: True for taxon_id in with_ids.keys()}
    for key in found_keys:
        without_ids.pop(key, None)
        found_ids[key] = True
    return with_ids, without_ids, found_ids


def stream_taxon_names(es, *, index, root=None, size=1000):
    """Get entries by depth of root taxon."""
    if root is not None:
        body = {
            "id": "taxon_names_by_root",
            "params": {"root": root},
        }
        return stream_template_search_results(es, index=index, body=body, size=size)
    body = {
        "id": "taxon_names",
        "params": {},
    }
    return stream_template_search_results(es, index=index, body=body)


def chunker(seq, size):
    """Loop through array in chunks."""
    return (seq[pos : pos + size] for pos in range(0, len(seq), size))


def translate_xrefs(es, *, index, xrefs, source):
    """Translate a list of xrefs into taxon_ids."""
    id_map = {}
    for refs in chunker(xrefs, 20):
        responses = query_keyword_value_template(
            es,
            "taxon_by_specific_name",
            source,
            refs,
            index,
            opts={"keyword": "source", "value": "name"},
        )
        for idx, res in enumerate(responses["responses"]):
            if "hits" in res and "hits" in res["hits"]:
                hits = res["hits"]["hits"]
                if len(hits) == 1:
                    id_map[refs[idx]] = hits[0]["_source"]["taxon_id"]
    return id_map


def load_taxon_table(es, opts, taxonomy_name, taxon_table):
    """Load all taxa into memory for taxon name lookup and spellcheck."""
    LOGGER.info("Loading taxa into memory for taxon name lookup")
    taxon_template = index_template(taxonomy_name, opts)
    root = None
    if "taxon-lookup-root" in opts:
        root = opts["taxon-lookup-root"]
    for node in tqdm(
        stream_taxon_names(es, index=taxon_template["index_name"], root=root)
    ):
        lineage = {}
        node_names = set()
        try:
            if "attributes" in node["_source"]:
                attributes = node["_source"]["attributes"]
            else:
                attributes = []
            for anc in node["_source"]["lineage"]:
                lineage.update({anc["taxon_rank"]: anc["scientific_name"]})
            taxon = {
                "taxon_id": node["_source"]["taxon_id"],
                "taxon_rank": node["_source"]["taxon_rank"],
                "scientific_name": node["_source"]["scientific_name"],
                "lineage": lineage,
                "attributes": attributes,
            }
            taxon_table["scientific"][node["_source"]["scientific_name"]].append(taxon)
            taxon_table["any"][node["_source"]["scientific_name"]].append(taxon)
            node_names.add(node["_source"]["scientific_name"])
            for obj in node["_source"]["taxon_names"]:
                if obj["name"] not in node_names:
                    node_names.add(obj["name"])
                    taxon_table["any"][obj["name"]].append(taxon)
        except KeyError:
            pass


def fix_missing_ids(
    es,
    opts,
    without_ids,
    *,
    types,
    taxon_template,
    failed_rows,
    imported_rows,
    with_ids=None,
    blanks=set(["NA", "None"]),
    header=None,
    spellings=None,
    taxon_table=None,
):
    """Find or create taxon IDs for rows without."""
    if with_ids is None:
        with_ids = {}
    if spellings is None:
        spellings = {"spellcheck": {}, "synonym": {}}
    found_ids = {}
    if without_ids:
        # TODO: support multiple taxonomies
        LOGGER.info("Looking up %d missing taxon IDs", len(without_ids.keys()))
        with_ids, without_ids, found_ids = lookup_missing_taxon_ids(
            es,
            without_ids,
            opts,
            with_ids=with_ids,
            blanks=blanks,
            spellings=spellings,
            taxon_table=taxon_table,
        )
        # create new taxon IDs
        if "taxonomy" in types and "alt_taxon_id" in types["taxonomy"]:
            LOGGER.info(
                "Using alt_taxon_id to fill in %d missing taxon IDs",
                len(without_ids.keys()),
            )
            created_ids = create_taxa(
                es,
                opts,
                data=without_ids,
                blanks=blanks,
                taxon_template=taxon_template,
                spellings=spellings,
            )
            for created_id in created_ids:
                if created_id in without_ids:
                    with_ids[created_id] = without_ids[created_id]
                    found_ids[created_id] = True
                    del without_ids[created_id]
    if failed_rows:
        for key, value in found_ids.items():
            if key in failed_rows:
                imported_rows += failed_rows[key]
                del failed_rows[key]
        if failed_rows:
            LOGGER.info(
                "Unable to associate %d records with taxon IDs", len(failed_rows)
            )
            write_imported_rows(
                failed_rows, opts, types=types, header=header, label="exceptions"
            )
    return with_ids, without_ids


def add_taxonomy_info_to_meta(meta, source):
    """Add taxonomy information to a metadata dict."""
    keys = {"lineage", "parent", "scientific_name", "taxon_names", "taxon_rank"}
    for key in keys:
        if key in source:
            meta[key] = source[key]


def stream_taxa(taxa):
    """Stream dict of taxa for indexing."""
    for taxon_id, value in taxa.items():
        yield "taxon-%s" % taxon_id, value


def get_taxa_to_create(
    es,
    opts,
    *,
    taxonomy_name,
    taxon_ids=None,
    asm_by_taxon_id=None,
):
    """Create a dict of taxa to create."""
    taxa_to_create = {}
    if not taxon_ids:
        return {}
    if asm_by_taxon_id is None:
        asm_by_taxon_id = {}
    taxonomy_template = taxonomy_index_template(taxonomy_name, opts)
    taxonomy_res = query_value_template(
        es,
        "taxonomy_node_by_taxon_id",
        taxon_ids,
        taxonomy_template["index_name"],
    )
    if taxonomy_res is None:
        LOGGER.error(
            "Could not connect to taxonomy index '%s'",
            taxonomy_template["index_name"],
        )
        sys.exit(1)
    ancestors = set()
    for taxonomy_result in taxonomy_res["responses"]:
        if taxonomy_result["hits"]["total"]["value"] == 1:
            source = taxonomy_result["hits"]["hits"][0]["_source"]
            taxa_to_create[source["taxon_id"]] = source
            for ancestor in source["lineage"]:
                ancestors.add(ancestor["taxon_id"])
            if source["taxon_id"] in asm_by_taxon_id:
                for asm in asm_by_taxon_id[source["taxon_id"]]:
                    add_taxonomy_info_to_meta(asm, source)
    taxonomy_res = query_value_template(
        es,
        "taxonomy_node_by_taxon_id",
        list(ancestors),
        taxonomy_template["index_name"],
    )
    if taxonomy_res and "responses" in taxonomy_res:
        for taxonomy_result in taxonomy_res["responses"]:
            if taxonomy_result["hits"]["total"]["value"] == 1:
                source = taxonomy_result["hits"]["hits"][0]["_source"]
                taxa_to_create[source["taxon_id"]] = source
    return taxa_to_create


def find_or_create_taxa(es, opts, *, taxon_ids, taxon_template, asm_by_taxon_id=None):
    """Find taxa in taxon index or create new taxon entries from taxonomy."""
    taxa = lookup_taxa_by_taxon_id(
        es, list(taxon_ids), taxon_template, return_type="dict"
    )
    missing_taxa = [taxon_id for taxon_id in taxon_ids if taxon_id not in taxa]
    to_create = get_taxa_to_create(
        es,
        opts,
        taxonomy_name=opts["taxonomy-source"],
        taxon_ids=missing_taxa,
        asm_by_taxon_id=asm_by_taxon_id,
    )
    index_stream(
        es,
        taxon_template["index_name"],
        stream_taxa(to_create),
        dry_run=opts.get("dry-run", False),
    )
    taxa.update(
        {
            taxon_id: {"_id": "taxon-%s" % taxon_id, "_source": obj}
            for taxon_id, obj in to_create.items()
        }
    )
    return taxa


def list_ancestors(taxa):
    """Convert a dict of taxa to a list of ancestral taxon_ids."""
    ancestors = set()
    for doc in taxa.values():
        if "_source" in doc:
            lineage = doc["_source"].get("lineage", [])
        else:
            lineage = doc.get("lineage", [])
        for entry in lineage:
            ancestors.add(entry["taxon_id"])
    return list(ancestors)


def add_names_to_list(existing, new, *, blanks=set({"NA", "None"})):
    """Add names to a list if they do not already exist."""
    names = defaultdict(dict)
    for entry in existing:
        names[entry["class"]][entry["name"]] = True
    for entry in new:
        entry["class"] = entry["class"].lower()  # .replace("_", " ")
        if entry["name"] not in blanks and entry["name"] not in names[entry["class"]]:
            existing.append(entry)
            names[entry["class"]][entry["name"]] = True


def add_names_and_attributes_to_taxa(
    es, data, opts, *, template, blanks=set(["NA", "None"])
):
    """Add names and attributes to taxa."""
    for values in chunks(list(data.keys()), 500):
        # taxa = lookup_taxa_by_taxon_id(es, values, template, return_type="list")
        all_taxa = find_or_create_taxa(
            es,
            opts,
            taxon_ids=values,
            taxon_template=template,
        )
        taxa = []
        for taxon_id in values:
            if taxon_id in all_taxa:
                taxa.append(all_taxa[taxon_id])
        for doc in taxa:
            if doc is not None:
                taxon_data = data[doc["_source"]["taxon_id"]]
                taxon_names = []
                attributes = []
                for entry in taxon_data:
                    if "attributes" in entry:
                        attributes = attributes + entry["attributes"]
                    if "taxon_names" in entry:
                        taxon_names += entry["taxon_names"]
                if "taxon_names" not in doc["_source"]:
                    doc["_source"]["taxon_names"] = []
                add_names_to_list(
                    doc["_source"]["taxon_names"], taxon_names, blanks=blanks
                )
                if (
                    "attributes" not in doc["_source"]
                    or not doc["_source"]["attributes"]
                ):
                    doc["_source"]["attributes"] = []
                add_attribute_values(doc["_source"]["attributes"], attributes)
                yield doc["_id"], doc["_source"]


def lookup_taxon_within_lineage(
    es,
    name,
    lineage,
    opts,
    *,
    rank=None,
    anc_rank=None,
    return_type="taxon",
    name_class="scientific",
):
    """Lookup taxon ID in a specified lineage."""
    template = index_template(opts["taxonomy-source"].lower(), opts)
    body = {
        "id": "taxon_by_lineage",
        "params": {
            "taxon": name,
            "rank": rank,
            "lineage": lineage,
            "anc_rank": anc_rank,
        },
    }
    if name_class == "any":
        body.update({"id": "taxon_by_any_name_by_lineage"})
    with tolog.DisableLogger():
        res = es.search_template(
            body=body, index=template["index_name"], rest_total_hits_as_int=True
        )
    if "hits" in res and res["hits"]["total"] > 0:
        if return_type == "taxon_id":
            return [hit["_source"]["taxon_id"] for hit in res["hits"]["hits"]]
        return [hit for hit in res["hits"]["hits"]]
    index = template["index_name"].replace("taxon", "taxonomy")
    with tolog.DisableLogger():
        res = es.search_template(body=body, index=index, rest_total_hits_as_int=True)
    if "hits" in res and res["hits"]["total"] > 0:
        if return_type == "taxon_id":
            return [hit["_source"]["taxon_id"] for hit in res["hits"]["hits"]]
        return [hit for hit in res["hits"]["hits"]]
    return []


def spellcheck_taxon(es, name, index, rank, taxonomy_index_template, opts, return_type):
    """Look up taxon name with fuzzy matching."""
    taxon_suggest = {
        "id": "taxon_suggest",
        "params": {"searchTerm": name},
    }
    matches = None
    with tolog.DisableLogger():
        suggestions = es.search_template(
            body=taxon_suggest, index=index, rest_total_hits_as_int=True
        )
        try:
            options = suggestions["suggest"]["simple_phrase"][0]["options"]
            matches = [
                option["text"]
                for option in options
                if option.get("collate_match", False)
            ]
        except KeyError:
            return None, rank, None
        except ValueError:
            return None, rank, None
    taxon_id = None
    if matches:
        taxon_matches = {}
        scientific_name = None
        for match in matches:
            body = {
                "id": "taxon_by_any_name",
                "params": {"taxon": match, "rank": rank},
            }
            taxa = taxon_lookup(
                es, body, index, taxonomy_index_template, opts, return_type="taxon"
            )
            if len(taxa) > 1:
                return None, rank, matches
            for taxon in taxa:
                source = taxon["_source"]
                taxon_id = source["taxon_id"]
                taxon_matches[taxon_id] = source["scientific_name"]
                scientific_name = source["scientific_name"]
        if len(taxon_matches.keys()) == 1:
            return taxon_id, rank, [scientific_name]
    return None, rank, matches


def taxon_lookup(es, body, index, taxonomy_index_template, opts, return_type):
    """Query elasticsearch for a taxon."""
    taxa = []
    with tolog.DisableLogger():
        res = es.search_template(body=body, index=index, rest_total_hits_as_int=True)
    if "hits" in res and res["hits"]["total"] > 0:
        if return_type == "taxon_id":
            taxa = [hit["_source"]["taxon_id"] for hit in res["hits"]["hits"]]
        else:
            taxa = [hit for hit in res["hits"]["hits"]]
    else:
        template = taxonomy_index_template(opts["taxonomy-source"].lower(), opts)
        index = template["index_name"]
        with tolog.DisableLogger():
            res = es.search_template(
                body=body, index=index, rest_total_hits_as_int=True
            )
        if "hits" in res and res["hits"]["total"] > 0:
            if return_type == "taxon_id":
                taxa = [hit["_source"]["taxon_id"] for hit in res["hits"]["hits"]]
            else:
                taxa = [hit for hit in res["hits"]["hits"]]
    return taxa


def lookup_taxon_in_index(
    es,
    name,
    opts,
    *,
    rank,
    name_class,
    return_type,
    spellings,
):
    """Lookup taxon in Elasticsearch index."""
    template = index_template(opts["taxonomy-source"].lower(), opts)
    index = template["index_name"]
    body = {
        "id": "taxon_by_name",
        "params": {"taxon": name, "rank": rank},
    }
    if name_class in {"any", "spellcheck"}:
        body.update({"id": "taxon_by_any_name"})
    if name_class == "spellcheck":
        taxon_id, rank, matches = spellcheck_taxon(
            es, name, index, rank, taxonomy_index_template, opts, return_type
        )
        if matches:
            spellings["spellcheck"].update(
                {name: {"matches": matches, "taxon_id": taxon_id, "rank": rank}}
            )
        return []
    taxa = taxon_lookup(es, body, index, taxonomy_index_template, opts, return_type)
    return taxa


def lookup_taxon_in_memory(
    name, opts, *, rank, name_class, return_type, spellings, taxon_table
):
    """Lookup taxon in memory."""
    taxa = []
    if name_class in taxon_table:
        if name in taxon_table[name_class]:
            for obj in taxon_table[name_class][name]:
                if return_type == "taxon_id":
                    taxa.append(obj["taxon_id"])
                else:
                    taxa.append({"_source": {**obj}})
    return taxa


def lookup_taxon(
    es,
    name,
    opts,
    *,
    rank=None,
    name_class="scientific",
    return_type="taxon_id",
    spellings=None,
    taxon_table=None,
    taxonomy=None
):
    """Lookup taxon ID."""
    if spellings is None:
        spellings = {"spellcheck": {}, "synonym": {}}
    if taxon_table is None or name_class == "spellcheck":
        taxa = lookup_taxon_in_index(
            es,
            name,
            opts,
            rank=rank,
            name_class=name_class,
            return_type=return_type,
            spellings=spellings,
        )
    else:
        taxa = lookup_taxon_in_memory(
            name,
            opts,
            rank=rank,
            name_class=name_class,
            return_type=return_type,
            spellings=spellings,
            taxon_table=taxon_table,
        )
    if (
        not taxa
        and opts["taxon-lookup"] == "any"
        and name_class not in {"any", "spellcheck"}
    ):
        taxa, name_class = lookup_taxon(
            es,
            name,
            opts,
            rank=rank,
            name_class="any",
            return_type=return_type,
            spellings=spellings,
            taxon_table=taxon_table,
            taxonomy=taxonomy
        )
    if (
        not taxa
        and "taxon-spellcheck" in opts
        and opts["taxon-spellcheck"]
        and name_class != "spellcheck"
    ):
        taxa, name_class = lookup_taxon(
            es,
            name,
            opts,
            rank=rank,
            name_class="spellcheck",
            return_type=return_type,
            spellings=spellings,
            taxon_table=taxon_table,
            taxonomy=taxonomy
        )
    if taxonomy is None or int(opts["taxon-matching-ranks"]) == 0:
        return taxa, name_class
    # filter taxa to ensure lineage matches
    filtered_taxa = []
    for taxon in taxa:
        compatible_count = 0
        compatible = True
        for anc_index, ancestor in enumerate(taxon["_source"]["lineage"]):
            if not ancestor["taxon_rank"].endswith("species"):
                if ancestor["taxon_rank"] in taxonomy and taxonomy[ancestor["taxon_rank"]]:
                    if ancestor["scientific_name"].lower() != taxonomy[ancestor["taxon_rank"]].lower():
                        anc_taxa, anc_name_class = lookup_taxon(
                            es,
                            taxonomy[ancestor["taxon_rank"]],
                            opts,
                            rank=ancestor["taxon_rank"],
                            name_class="any",  # TODO: add option to use spellcheck
                            return_type=return_type,
                            spellings=spellings,
                            taxon_table=taxon_table,
                            # taxonomy=taxonomy
                        )
                        if anc_taxa:
                            compatible_anc = False
                            for anc_taxon in anc_taxa:
                                if anc_taxon["_source"]["parent"] == taxon["_source"]["lineage"][anc_index + 1]["taxon_id"]:
                                    compatible_anc = True
                                    compatible_count += 1
                                    break
                        else:
                            compatible = False
                        if not compatible or not compatible_anc:
                            compatible = False
                            break
                    else:
                        compatible_count += 1
                    if compatible_count == int(opts["taxon-matching-ranks"]):
                        break
        if compatible:
            filtered_taxa.append(taxon)
    return filtered_taxa, name_class


def generate_ancestral_taxon_id(name, rank, *, alt_taxon_id=None, taxon_ids=None):
    """Generate an ancestral taxon ID."""
    if taxon_ids is None:
        taxon_ids = set({})
    increment = 0
    while True:
        # TODO: make robust to imports from separate files
        anc_taxon_id = "anc_%s" % name
        if increment:
            anc_taxon_id += "_%d" % increment
        if anc_taxon_id not in taxon_ids:
            taxon_ids.add(anc_taxon_id)
            return anc_taxon_id
        increment += 1


def create_descendant_taxon(taxon_id, rank, name, closest_taxon):
    """Set taxon and lineage information for a descendant taxon."""
    desc_taxon = {
        "_id": "taxon-%s" % taxon_id,
        "_source": {
            "taxon_id": taxon_id,
            "taxon_rank": rank,
            "scientific_name": name,
            "additional_taxon": True,
            "parent": closest_taxon["_source"]["taxon_id"],
            "taxon_names": [{"class": "scientific name", "name": name}],
        },
    }
    lineage = [
        {
            "node_depth": 1,
            "taxon_id": closest_taxon["_source"]["taxon_id"],
            "taxon_rank": closest_taxon["_source"]["taxon_rank"],
            "scientific_name": closest_taxon["_source"]["scientific_name"],
        }
    ]
    if "lineage" in closest_taxon["_source"]:
        for ancestor in closest_taxon["_source"]["lineage"]:
            lineage.append(
                {
                    "taxon_id": ancestor["taxon_id"],
                    "taxon_rank": ancestor["taxon_rank"],
                    "scientific_name": ancestor["scientific_name"],
                    "node_depth": ancestor["node_depth"] + 1,
                }
            )
    desc_taxon["_source"]["lineage"] = lineage
    return desc_taxon


def add_new_taxon(alt_taxon_id, new_taxa, obj, closest_taxon, *, blanks={"NA", "None"}):
    """Add a new taxon with alt_taxon_id to list of taxa."""
    # TODO: Allow creation of new higher taxa
    ranks = [
        "subspecies",
        "species",
        "genus",
        "family",
        "order",
        "class",
        "subphylum",
        "phylum",
    ]
    if alt_taxon_id not in new_taxa:
        alt_rank = None
        for rank in ranks:
            if (
                rank in obj["taxonomy"]
                and obj["taxonomy"][rank]
                and obj["taxonomy"][rank] not in blanks
            ):
                alt_rank = rank
                break
        if alt_rank is not None:
            new_taxon = create_descendant_taxon(
                alt_taxon_id, alt_rank, obj["taxonomy"][alt_rank], closest_taxon
            )
            new_taxa.update({new_taxon["_source"]["taxon_id"]: new_taxon["_source"]})
    return new_taxon


def set_ranks(taxonomy):
    """Set ranks for species/subspecies creation."""
    default_ranks = [
        "genus",
        "family",
        "order",
        "class",
        "subphylum",
        "phylum",
    ]
    taxon_rank = None
    if "subspecies" in taxonomy:
        ranks = ["species"] + default_ranks
        taxon_rank = "subspecies"
    else:
        ranks = default_ranks
        for rank in ["species"] + default_ranks:
            if rank in taxonomy:
                taxon_rank = rank
                break
    return ranks, taxon_rank


def create_new_taxon(
    alt_taxon_id,
    closest_taxon,
    closest_rank,
    lineage,
    new_taxa,
    taxon_ids,
    obj,
    matches,
    taxa,
    ancestors,
):
    """Create a new taxon with new ancestral taxa as required."""
    if closest_taxon is not None:
        for intermediate in reversed(lineage):
            taxon_id = generate_ancestral_taxon_id(
                intermediate["name"],
                intermediate["rank"],
                alt_taxon_id=alt_taxon_id,
                taxon_ids=taxon_ids,
            )
            new_taxon = create_descendant_taxon(
                taxon_id, intermediate["rank"], intermediate["name"], closest_taxon
            )
            new_taxa.update({new_taxon["_source"]["taxon_id"]: new_taxon["_source"]})
            matches[intermediate["name"]][obj["taxonomy"][closest_rank]] = taxa
            closest_rank = intermediate["rank"]
            closest_taxon = new_taxon
        ancestors[alt_taxon_id] = closest_taxon
        added_taxon = add_new_taxon(alt_taxon_id, new_taxa, obj, closest_taxon)
        matches[added_taxon["_source"]["scientific_name"]][
            closest_taxon["_source"]["scientific_name"]
        ] = [added_taxon]


def find_ancestor(
    ranks,
    index,
    obj,
    taxon,
    matches,
    ancestors,
    alt_taxon_id,
    es,
    opts,
    rank,
    lookup_name_class,
    intermediates,
    blanks,
):
    """Loop through ancestral ranks to link new taxon to an ancestor."""
    for anc_rank in ranks[(index + 1) :]:
        if anc_rank not in obj["taxonomy"] or obj["taxonomy"][anc_rank] in blanks:
            # row has no name at this rank
            continue
        if taxon in matches and obj["taxonomy"][anc_rank] in matches[taxon]:
            # this taxon has been seen before
            taxa = matches[taxon][obj["taxonomy"][anc_rank]]
            ancestors.update({alt_taxon_id: taxa[0]})
            break
        else:
            # find existing ancestral taxa within a lineage
            # TODO: make an in memory version of this lookup
            taxa = lookup_taxon_within_lineage(
                es,
                taxon,
                obj["taxonomy"][anc_rank],
                opts,
                rank=rank,
                anc_rank=anc_rank,
                return_type="taxon",
                name_class=lookup_name_class,
            )
        if taxa:
            if len(taxa) == 1:
                #  unambiguous match to a single existing taxon
                ancestors.update({alt_taxon_id: taxa[0]})
                matches[taxon][obj["taxonomy"][anc_rank]] = taxa
                break
        elif intermediates == 0:
            taxa, name_class = lookup_taxon(
                es,
                obj["taxonomy"][anc_rank],
                opts,
                rank=anc_rank,
                return_type="taxon",
                name_class="any",
            )
            if taxa and len(taxa) == 1:
                taxa = lookup_taxon_within_lineage(
                    es,
                    taxon,
                    taxa[0]["_source"]["scientific_name"],
                    opts,
                    rank=rank,
                    anc_rank=anc_rank,
                    return_type="taxon",
                    name_class=lookup_name_class,
                )
                if taxa and len(taxa) == 1:
                    ancestors.update({alt_taxon_id: taxa[0]})
                    matches[taxon][obj["taxonomy"][anc_rank]] = taxa
                    break
        intermediates += 1
    return anc_rank, taxa


def create_taxa(
    es, opts, *, taxon_template, data=None, blanks=set(["NA", "None"]), spellings=None
):
    """Create new taxa using alternate taxon IDs."""
    if spellings is None:
        spellings = {"spellcheck": {}, "synonym": {}}
    ancestors = {}
    matches = defaultdict(dict)
    pbar = tqdm(total=len(data.keys()))
    taxon_ids = set({})
    new_taxa = {}
    for rows in data.values():
        obj = rows[0]
        pbar.update(1)
        if (
            "taxonomy" not in obj
            or "alt_taxon_id" not in obj["taxonomy"]
            or obj["taxonomy"]["alt_taxon_id"] in blanks
        ):
            # row has no alt_taxon_id
            continue
        alt_taxon_id = obj["taxonomy"]["alt_taxon_id"]
        lineage = []
        closest_rank = None
        closest_taxon = None
        # fetch ancestral ranks and current taxon rank
        ranks, taxon_rank = set_ranks(obj["taxonomy"])
        if taxon_rank in obj["taxonomy"] and obj["taxonomy"][taxon_rank] in spellings:
            # taxon name may be mis-spelled
            continue
        max_index = len(ranks) - 1
        lookup_name_class = "any" if opts["taxon-lookup"] == "any" else "scientific"
        # loop through lineage to find existing ancestral taxa
        for index, rank in enumerate(ranks[: (max_index - 1)]):
            if rank not in obj["taxonomy"] or obj["taxonomy"][rank] in blanks:
                # row has no name at this rank
                continue
            if obj["taxonomy"][rank] in spellings:
                # ancestral taxon name is missing or may be mis-spelled
                break
            intermediates = 0
            taxon = obj["taxonomy"][rank]
            # loop through higher ranks to disambiguate name clashes
            anc_rank, taxa = find_ancestor(
                ranks,
                index,
                obj,
                taxon,
                matches,
                ancestors,
                alt_taxon_id,
                es,
                opts,
                rank,
                lookup_name_class,
                intermediates,
                blanks,
            )
            if alt_taxon_id in ancestors:
                closest_rank = rank
                if taxon in matches and obj["taxonomy"][anc_rank] in matches[taxon]:
                    closest_taxon = matches[taxon][obj["taxonomy"][anc_rank]][0]
                else:
                    closest_taxon = matches[obj["taxonomy"][anc_rank]]["all"][0]
                break
            lineage.append({"rank": rank, "name": taxon})
        # create a new taxon if a closest ancestral taxon could be found
        create_new_taxon(
            alt_taxon_id,
            closest_taxon,
            closest_rank,
            lineage,
            new_taxa,
            taxon_ids,
            obj,
            matches,
            taxa,
            ancestors,
        )
    pbar.close()
    # add new taxa to the index
    index_stream(
        es,
        taxon_template["index_name"],
        stream_taxa(new_taxa),
        dry_run=opts.get("dry-run", False),
    )
    # return a list of alt_taxon_ids for the created taxa
    return new_taxa.keys()
