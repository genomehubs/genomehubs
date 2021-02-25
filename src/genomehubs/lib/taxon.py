#!/usr/bin/env python3

"""Taxon methods."""

import os
import sys
from collections import defaultdict

from tolkein import tofile
from tolkein import tolog
from tqdm import tqdm

from .es_functions import EsQueryBuilder
from .es_functions import document_by_id
from .es_functions import index_stream
from .es_functions import query_keyword_value_template
from .es_functions import query_value_template
from .hub import add_attribute_values
from .hub import add_attributes
from .hub import chunks
from .hub import index_templator
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
        es, ["taxon_id-%s" % value for value in values], template["index_name"]
    )
    if res is not None:
        if return_type == "list":
            taxa = [key.replace("taxon_id-", "") for key in res.keys()]
        else:
            for key, source in res.items():
                taxon_id = key.replace("taxon_id-", "")
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
    es, without_ids, opts, *, with_ids=None, blanks=set(["NA", "None"])
):
    """Lookup taxon ID based on available taxonomic information."""
    if with_ids is None:
        with_ids = {}
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
                taxon_ids, name_class = lookup_taxon(
                    es, obj["taxonomy"][rank], opts, rank=rank
                )
                if index == 1 and not taxon_ids:
                    break
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


def fix_missing_ids(
    es,
    opts,
    without_ids,
    *,
    types,
    taxon_template,
    failed_rows,
    with_ids=None,
    blanks=set(["NA", "None"]),
    header=None,
):
    """Find or create taxon IDs for rows without."""
    if with_ids is None:
        with_ids = {}
    if without_ids:
        # TODO: support multiple taxonomies
        LOGGER.info("Looking up %d missing taxon IDs", len(without_ids.keys()))
        with_ids, without_ids, found_ids = lookup_missing_taxon_ids(
            es, without_ids, opts, with_ids=with_ids, blanks=blanks
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
            )
            for created_id in created_ids:
                if created_id in without_ids:
                    with_ids[created_id] = without_ids[created_id]
                    found_ids[created_id] = True
                    del without_ids[created_id]
    if without_ids and failed_rows:
        for key, value in found_ids.items():
            if key in failed_rows:
                del failed_rows[key]
        if failed_rows:
            LOGGER.info(
                "Unable to associate %d records with taxon IDs", len(failed_rows)
            )
            data = []
            exception_key = "%s-exception" % opts["index"]
            dir_key = "%s-dir" % opts["index"]
            if exception_key in opts and opts[exception_key]:
                outdir = opts[exception_key]
            else:
                outdir = "%s/exceptions" % opts[dir_key]
            os.makedirs(outdir, exist_ok=True)
            outfile = "%s/%s" % (outdir, types["file"]["name"])
            if header:
                data.append(header)
            for rows in failed_rows.values():
                for row in rows:
                    data.append(row)
            LOGGER.info(
                "Writing %d records to exceptions file '%s", len(data) - 1, outfile
            )
            tofile.write_file(outfile, data)
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
        yield "taxon_id-%s" % taxon_id, value


def get_taxa_to_create(
    es, opts, *, taxonomy_name="ncbi", taxon_ids=None, asm_by_taxon_id=None,
):
    """Create a dict of taxa to create."""
    taxa_to_create = {}
    if not taxon_ids:
        return {}
    if asm_by_taxon_id is None:
        asm_by_taxon_id = {}
    taxonomy_template = taxonomy_index_template(taxonomy_name, opts)
    taxonomy_res = query_value_template(
        es, "taxonomy_node_by_taxon_id", taxon_ids, taxonomy_template["index_name"],
    )
    if taxonomy_res is None:
        LOGGER.error(
            "Could not connect to taxonomy index '%s'", taxonomy_template["index_name"],
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
        taxonomy_name="ncbi",
        taxon_ids=missing_taxa,
        asm_by_taxon_id=asm_by_taxon_id,
    )
    index_stream(
        es, taxon_template["index_name"], stream_taxa(to_create),
    )
    taxa.update(
        {
            taxon_id: {"_id": "taxon_id-%s" % taxon_id, "_source": obj}
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
    for name_class, name in new.items():
        name_class = name_class.replace("_", " ")
        if (
            name not in blanks
            and name_class not in names
            and name not in names[name_class]
        ):
            existing.append({"name": name, "class": name_class})
            names[name_class][name] = True


def add_names_and_attributes_to_taxa(
    es, data, opts, *, template, blanks=set(["NA", "None"])
):
    """Add names and attributes to taxa."""
    for values in chunks(list(data.keys()), 500):
        # taxa = lookup_taxa_by_taxon_id(es, values, template, return_type="list")
        all_taxa = find_or_create_taxa(
            es, opts, taxon_ids=values, taxon_template=template,
        )
        taxa = []
        for taxon_id in values:
            if taxon_id in all_taxa:
                taxa.append(all_taxa[taxon_id])
        for doc in taxa:
            if doc is not None:
                taxon_data = data[doc["_source"]["taxon_id"]]
                taxon_names = {}
                attributes = []
                for entry in taxon_data:
                    if "attributes" in entry:
                        attributes = attributes + entry["attributes"]
                    if "taxon_names" in entry:
                        taxon_names.update(entry["taxon_names"])
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
    template = index_template(opts["taxonomy-source"][0], opts)
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


def lookup_taxon(
    es, name, opts, *, rank=None, name_class="scientific", return_type="taxon_id"
):
    """Lookup taxon ID."""
    taxa = []
    template = index_template(opts["taxonomy-source"][0], opts)
    body = {
        "id": "taxon_by_name",
        "params": {"taxon": name, "rank": rank},
    }
    if name_class == "any":
        body.update({"id": "taxon_by_any_name"})
    index = template["index_name"]
    with tolog.DisableLogger():
        res = es.search_template(body=body, index=index, rest_total_hits_as_int=True)
    if "hits" in res and res["hits"]["total"] > 0:
        if return_type == "taxon_id":
            taxa = [hit["_source"]["taxon_id"] for hit in res["hits"]["hits"]]
        else:
            taxa = [hit for hit in res["hits"]["hits"]]
    else:
        template = taxonomy_index_template(opts["taxonomy-source"][0], opts)
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
    if not taxa and opts["taxon-lookup"] == "any" and name_class != "any":
        taxa, name_class = lookup_taxon(
            es, name, opts, rank=rank, name_class="any", return_type=return_type
        )
    return taxa, name_class


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
        "_id": "taxon_id-%s" % taxon_id,
        "_source": {
            "taxon_id": taxon_id,
            "taxon_rank": rank,
            "scientific_name": name,
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
    if alt_taxon_id not in new_taxa:
        alt_rank = "species"
        if (
            "subspecies" in obj["taxonomy"]
            and obj["taxonomy"]["subspecies"]
            and obj["taxonomy"]["subspecies"] not in blanks
        ):
            alt_rank = "subspecies"
        new_taxon = create_descendant_taxon(
            alt_taxon_id, alt_rank, obj["taxonomy"][alt_rank], closest_taxon
        )
        new_taxa.update({new_taxon["_source"]["taxon_id"]: new_taxon["_source"]})
    return new_taxon


def create_taxa(es, opts, *, taxon_template, data=None, blanks=set(["NA", "None"])):
    """Create new taxa using alternate taxon IDs."""
    default_ranks = [
        "genus",
        "family",
        "order",
        "class",
        "subphylum",
        "phylum",
    ]
    ancestors = {}
    matches = defaultdict(dict)
    pbar = tqdm(total=len(data.keys()))
    taxon_ids = set({})
    new_taxa = {}
    for alt_taxon_id, rows in data.items():
        obj = rows[0]
        pbar.update(1)
        if "taxonomy" not in obj:
            continue
        lineage = []
        closest_rank = None
        closest_taxon = None
        if "subspecies" in obj["taxonomy"]:
            ranks = ["species"] + default_ranks
        else:
            ranks = default_ranks
        max_index = len(ranks) - 1
        # max_rank = ranks[max_index]
        for index, rank in enumerate(ranks[: (max_index - 1)]):
            if rank not in obj["taxonomy"] or obj["taxonomy"][rank] in blanks:
                continue
            intermediates = 0
            for anc_rank in ranks[(index + 1) :]:
                if (
                    anc_rank not in obj["taxonomy"]
                    or obj["taxonomy"][anc_rank] in blanks
                ):
                    continue
                if (
                    obj["taxonomy"][rank] in matches
                    and obj["taxonomy"][anc_rank] in matches[obj["taxonomy"][rank]]
                ):
                    taxa = matches[obj["taxonomy"][rank]][obj["taxonomy"][anc_rank]]
                    ancestors.update({alt_taxon_id: taxa[0]})
                    break
                else:
                    taxa = lookup_taxon_within_lineage(
                        es,
                        obj["taxonomy"][rank],
                        obj["taxonomy"][anc_rank],
                        opts,
                        rank=rank,
                        anc_rank=anc_rank,
                        return_type="taxon",
                    )
                if taxa:
                    if len(taxa) == 1:
                        ancestors.update({alt_taxon_id: taxa[0]})
                        matches[obj["taxonomy"][rank]][obj["taxonomy"][anc_rank]] = taxa
                        break
                # elif anc_rank == max_rank and intermediates == 0:
                elif intermediates == 0:
                    taxa, name_class = lookup_taxon(
                        es,
                        obj["taxonomy"][anc_rank],
                        opts,
                        rank=anc_rank,
                        return_type="taxon",
                    )
                    if taxa and len(taxa) == 1:
                        ancestors.update({alt_taxon_id: taxa[0]})
                        matches[obj["taxonomy"][anc_rank]]["all"] = taxa
                        break
                intermediates += 1
            if alt_taxon_id in ancestors:
                closest_rank = rank
                if (
                    obj["taxonomy"][rank] in matches
                    and obj["taxonomy"][anc_rank] in matches[obj["taxonomy"][rank]]
                ):
                    closest_taxon = matches[obj["taxonomy"][rank]][
                        obj["taxonomy"][anc_rank]
                    ][0]
                else:
                    closest_taxon = matches[obj["taxonomy"][anc_rank]]["all"][0]
                break
            lineage.append({"rank": rank, "name": obj["taxonomy"][rank]})
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
                new_taxa.update(
                    {new_taxon["_source"]["taxon_id"]: new_taxon["_source"]}
                )
                matches[intermediate["name"]][obj["taxonomy"][closest_rank]] = taxa
                closest_rank = intermediate["rank"]
                closest_taxon = new_taxon
            ancestors[alt_taxon_id] = closest_taxon
            added_taxon = add_new_taxon(alt_taxon_id, new_taxa, obj, closest_taxon)
            matches[added_taxon["_source"]["scientific_name"]][
                closest_taxon["_source"]["scientific_name"]
            ] = [added_taxon]
    pbar.close()
    index_stream(
        es, taxon_template["index_name"], stream_taxa(new_taxa),
    )
    return new_taxa.keys()


# def parse_taxa(es, types, taxonomy_template):
#     """Test method to parse taxa."""
#     taxa = [
#         {
#             "taxon_id": 110368,
#             "assembly_span": 12344567,
#             "c_value": 2.5,
#             "sex_determination_system": "N/A",
#         },
#         {
#             "taxon_id": 13037,
#             "assembly_span": 2345678,
#             "c_value": 2.3,
#             "sex_determination_system": "XO",
#         },
#         {
#             "taxon_id": 113334,
#             "assembly_span": 45678912,
#             "c_value": 4.6,
#             "sex_determination_system": "XY",
#         },
#     ]
#     for entry in taxa:
#         # attributes = {}
#         taxon_id = str(entry["taxon_id"])
#         doc = lookup_taxon_by_taxid(es, taxon_id, taxonomy_template)
#         if doc is None:
#             LOGGER.warning(
#                 "No %s taxonomy record for %s",
#                 taxonomy_template["index_name"],
#                 taxon_id,
#             )
#         attributes = add_attributes(entry, types, attributes=[])[0]
#         doc.update({"taxon_id": taxon_id, "attributes": attributes})
#         doc_id = "taxon_id-%s" % taxon_id
#         yield doc_id, doc


# def index(es, opts, *, taxonomy_name="ncbi"):
#     """Index a set of taxa."""
#     LOGGER.info("Indexing taxa using %s taxonomy", taxonomy_name)
#     template = index_template(taxonomy_name, opts)
#     taxonomy_template = taxonomy_index_template(taxonomy_name, opts)
#     stream = parse_taxa(es, template["types"], taxonomy_template)
#     return template, stream
