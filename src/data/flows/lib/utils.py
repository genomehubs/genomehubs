#!/usr/bin/python3

import contextlib
from typing import Optional

from genomehubs import utils as gh_utils


def set_feature_headers() -> list[str]:
    """Set chromosome headers.

    Returns:
        list: The list of headers.
    """
    return [
        "assembly_id",
        "sequence_id",
        "start",
        "end",
        "strand",
        "length",
        "midpoint",
        "midpoint_proportion",
        "seq_proportion",
    ]


class Config:
    """
    Configuration class for Genomehubs YAML parsing.
    """

    def __init__(self, config_file, feature_file=None, load_previous=False):
        """
        Initialize the configuration class.

        Args:
            config_file (str): Path to the YAML configuration file.
            feature_file (str): Path to the feature file.

        Returns:
            Config: The configuration class.
        """
        self.config = gh_utils.load_yaml(config_file)
        self.meta = gh_utils.get_metadata(self.config, config_file)
        self.headers = gh_utils.set_headers(self.config)
        self.parse_fns = gh_utils.get_parse_functions(self.config)
        self.previous_parsed = {}
        if load_previous:
            with contextlib.suppress(Exception):
                self.previous_parsed = gh_utils.load_previous(
                    self.meta["file_name"], "genbankAccession", self.headers
                )
        self.feature_file = feature_file
        if feature_file is not None:
            self.feature_headers = set_feature_headers()
            try:
                self.previous_features = gh_utils.load_previous(
                    feature_file, "assembly_id", self.feature_headers
                )
            except Exception:
                self.previous_features = {}


def load_config(
    config_file: str, feature_file: Optional[str] = None, load_previous: bool = False
) -> Config:
    """
    Load the configuration file.

    Args:
        config_file (str): Path to the YAML configuration file.
        feature_file (str): Path to the feature file.
        load_previous (bool): Whether to load the previous data.

    Returns:
        Config: The configuration class.
    """
    return Config(config_file, feature_file, load_previous)


class Parser:
    """
    Parser class for data file parsing.
    """

    def __init__(self, name: str, func: callable, description: str):
        """
        Initialize the parser class.

        Args:
            name (str): The name of the parser.
            func (callable): The parsing function.
            description (str): The description of the parser.

        Returns:
            Parser: The parser class.
        """
        self.name = name
        self.func = func
        self.description = description

    def parse(self, data: dict) -> dict:
        """
        Parse the data dictionary.

        Args:
            data (dict): The data dictionary to parse.

        Returns:
            dict: The parsed data dictionary.
        """
        parsed_data = {}
        self.callback(data, parsed_data)
        return parsed_data


def format_entry(entry, key: str, meta: dict) -> str:
    """
    Formats a single entry in a dictionary, handling the case where the entry is a list.

    Args:
        entry (Union[str, list]): The entry to be formatted, which may be a single
            value or a list of values.
        key (str): The key associated with the entry.
        meta (dict): A dictionary containing metadata, including a "separators"
            dictionary that maps keys to separator strings.

    Returns:
        str: The formatted entry, where list elements are joined using the separator
            specified in the "separators" dictionary.
    """
    if not isinstance(entry, list):
        return str(entry)
    if "separators" not in meta or isinstance(meta["separators"], str):
        return ",".join([str(e) for e in entry if e is not None])
    return (
        meta["separators"].get(key, ",").join([str(e) for e in entry if e is not None])
    )


def append_to_tsv(headers: list[str], rows: list[dict], meta: dict):
    """
    Appends the provided rows to a TSV file with the specified file name.

    Args:
        headers (list[str]): A list of column headers.
        rows (list[dict]): A list of dictionaries, where each dictionary represents a
            row of data and the keys correspond to the column headers.
        meta (dict): A dictionary containing metadata, including the "file_name" key
            which specifies the output file name.
    """
    with open(meta["file_name"], "a") as f:
        for row in rows:
            if isinstance(row, dict):
                f.write(
                    "\t".join(
                        [format_entry(row.get(col, []), col, meta) for col in headers]
                    )
                    + "\n"
                )


def convert_keys_to_camel_case(data: dict) -> dict:
    """
    Recursively converts all keys in a dictionary to camel case.

    Args:
        data (dict): The dictionary to convert.

    Returns:
        dict: The dictionary with keys converted to camel case.
    """
    converted_data = {}
    if isinstance(data, list):
        return [convert_keys_to_camel_case(item) for item in data]
    elif not isinstance(data, dict):
        return data
    for key, value in data.items():
        if isinstance(value, (dict, list)):
            value = convert_keys_to_camel_case(value)
        converted_key = "".join(
            word.capitalize() if i > 0 else word
            for i, word in enumerate(key.split("_"))
        )
        converted_data[converted_key] = value
    return converted_data


def set_organelle_name(seq: dict) -> Optional[str]:
    """
    Determines the organelle type (mitochondrion or plastid) based on the assigned
    molecule location type in the provided sequence data.

    Args:
        seq (dict): A dictionary containing sequence data, including the
            "assigned_molecule_location_type" field.

    Returns:
        Optional[str]: The organelle type, either "mitochondrion" or "plastid", or None
            if key error.
    """
    try:
        return (
            "mitochondrion"
            if seq[0]["assigned_molecule_location_type"].casefold()
            == "Mitochondrion".casefold()
            else "plastid"
        )
    except KeyError:
        return None


def is_assembled_molecule(seq: dict) -> bool:
    """
    Determines if the provided sequence data represents an assembled molecule.

    Args:
        seq (dict): A dictionary containing sequence data, including the "role" field.

    Returns:
        bool: True if the sequence data represents an assembled molecule, False
            otherwise.
    """
    try:
        return seq[0]["role"] == "assembled-molecule"
    except (IndexError, KeyError):
        return False


def set_additional_organelle_values(
    seq: dict, organelle: dict, data: dict, organelle_name: str
) -> None:
    """
    Sets additional organelle-related values in the provided data dictionary based on
    the sequence data. If the sequence data represents an assembled molecule, it
    extracts the GenBank accession, total sequence length, and GC percentage, and
    stores these values in the `processedOrganelleInfo` dictionary. If the sequence
    data does not represent an assembled molecule, it stores the accession numbers of
    the individual scaffolds in the `processedOrganelleInfo` dictionary.

    Args:
        seq (dict): A dictionary containing sequence data.
        organelle (dict): A dictionary representing an organelle.
        data (dict): A dictionary containing processed data.
        organelle_name (str): The name of the organelle.
    """
    if is_assembled_molecule(seq):
        organelle["genbankAssmAccession"] = seq[0]["genbank_accession"]
        organelle["totalSequenceLength"] = seq[0]["length"]
        organelle["gcPercent"] = seq[0]["gc_percent"]
        data["processedOrganelleInfo"][organelle_name]["assemblySpan"] = organelle[
            "totalSequenceLength"
        ]
        data["processedOrganelleInfo"][organelle_name]["gcPercent"] = organelle[
            "gcPercent"
        ]
        data["processedOrganelleInfo"][organelle_name]["accession"] = seq[0][
            "genbank_accession"
        ]
    else:
        data["processedOrganelleInfo"][organelle_name]["scaffolds"] = ";".join(
            [entry["genbank_accession"] for entry in seq]
        )


def initialise_organelle_info(data: dict, organelle_name: str):
    """
    Initializes the `processedOrganelleInfo` dictionary in the provided `data`
    dictionary, creating a new entry for the specified `organelle_name` if it doesn't
    already exist.

    Args:
        data (dict): The dictionary containing the processed data.
        organelle_name (str): The name of the organelle.
    """
    if "processedOrganelleInfo" not in data:
        data["processedOrganelleInfo"] = {}
    if organelle_name not in data["processedOrganelleInfo"]:
        data["processedOrganelleInfo"][organelle_name] = {}


def set_organelle_values(data: dict, seq: dict) -> dict:
    """
    Sets organelle-related values in the provided data dictionary based on the sequence
    report data.

    Args:
        data (dict): A dictionary containing processed data.
        seq (dict): A dictionary containing sequence data.

    Returns:
        dict: A dictionary containing organelle-related information.
    """
    organelle: dict = {
        "sourceAccession": data["accession"],
        "organelle": seq[0]["assigned_molecule_location_type"],
    }
    organelle_name: str = set_organelle_name(seq)
    initialise_organelle_info(data, organelle_name)
    set_additional_organelle_values(seq, organelle, data, organelle_name)
    return organelle


def add_organelle_entries(data: dict, organelles: dict) -> None:
    """
    Adds entries for co-assembled organelles to the provided data dictionary.

    Args:
        data (dict): A dictionary containing processed data.
        organelles (dict): A dictionary containing sequence data for co-assembled
            organelles.

    Returns:
        None
    """
    if not organelles:
        return
    data["organelles"] = []
    for seq in organelles.values():
        try:
            organelle = set_organelle_values(data, seq)
            data["organelles"].append(organelle)
        except Exception as err:
            print("ERROR: ", err)
            raise err


def add_chromosome_entries(data: dict, chromosomes: list[dict]) -> None:
    """
    Adds feature entries for assembled chromosomes to the provided data object.

    Args:
        data (dict): A dictionary containing processed data.
        chromosomes (list): A list of dictionaries containing sequence data for
            assembled chromosomes.

    Returns:
        None
    """
    data["chromosomes"] = []
    for seq in chromosomes:
        data["chromosomes"].append(
            {
                "assembly_id": data["processedAssemblyInfo"]["genbankAccession"],
                "sequence_id": seq.get("genbank_accession", ""),
                "start": 1,
                "end": seq["length"],
                "strand": 1,
                "length": seq["length"],
                "midpoint": round(seq["length"] / 2),
                "midpoint_proportion": 0.5,
                "seq_proportion": seq["length"]
                / int(data["assemblyStats"]["totalSequenceLength"]),
            }
        )


def is_chromosome(seq: dict) -> bool:
    """
    Determines if the given sequence data represents an assembled chromosome.

    Args:
        seq (dict): A dictionary containing sequence data.

    Returns:
        bool: True if the sequence data represents an assembled chromosome, False
            otherwise.
    """
    return seq["role"] == "assembled-molecule"


def is_non_nuclear(seq: dict) -> bool:
    """
    Determines if the given sequence data represents a non-nuclear sequence.

    Args:
        seq (dict): A dictionary containing sequence data.

    Returns:
        bool: True if the sequence data represents a non-nuclear sequence, False
            otherwise.
    """
    return seq["assembly_unit"] == "non-nuclear"


def is_assigned_to_chromosome(seq: dict) -> bool:
    """
    Determines if the given sequence data represents a sequence that is assigned to a
    chromosome.

    Args:
        seq (dict): A dictionary containing sequence data.

    Returns:
        bool: True if the sequence data represents a sequence that is assigned to a
            chromosome, False otherwise.
    """
    return (
        seq["assembly_unit"] == "Primary Assembly"
        and seq["assigned_molecule_location_type"]
        in [
            "Chromosome",
            "Linkage Group",
        ]
        and seq["role"] in ["assembled-molecule", "unlocalized-scaffold"]
    )


def check_ebp_criteria(
    data: dict, span: int, chromosomes: list, assigned_span: int
) -> bool:
    """
    Checks if the given assembly data meets the EBP (Earth BioGenome Project) criteria.

    Args:
        data (dict): A dictionary containing assembly statistics and information.
        span (int): The total span of the assembly.
        chromosomes (list): A list of chromosome names.
        assigned_span (int): The total span of the sequences assigned to chromosomes.

    Returns:
        None: This function modifies the `data` dictionary in-place to add the processed
            assembly statistics.
    """
    contig_n50 = int(data["assemblyStats"].get("contigN50", 0))
    scaffold_n50 = int(data["assemblyStats"].get("scaffoldN50", 0))
    assignedProportion = None
    if not chromosomes:
        return False
    data["processedAssemblyStats"] = {}
    assignedProportion = assigned_span / span
    standardCriteria = []
    if contig_n50 >= 1000000 and scaffold_n50 >= 10000000:
        standardCriteria.append("6.7")
    if assignedProportion >= 0.9:
        if contig_n50 >= 1000000:
            standardCriteria.append("6.C")
        elif scaffold_n50 < 1000000 and contig_n50 >= 100000:
            standardCriteria.append("5.C")
        elif scaffold_n50 < 10000000 and contig_n50 >= 100000:
            standardCriteria.append("5.6")
    if standardCriteria:
        data["processedAssemblyStats"]["ebpStandardDate"] = data["assemblyInfo"][
            "releaseDate"
        ]
        data["processedAssemblyStats"]["ebpStandardCriteria"] = standardCriteria
    data["processedAssemblyStats"]["assignedProportion"] = assignedProportion
    return False


def update_organelle_info(data: dict, row: dict) -> None:
    """Update organelle info in data dict with fields from row.

    Args:
        data (dict): A dictionary containing the organelle information.
        row (dict): A dictionary containing the fields to update the organelle
        information with.

    Returns:
        None: This function modifies the `data` dictionary in-place.
    """
    for organelle in data.get("organelles", []):
        organelle.update(
            {
                k: row[k]
                for k in row.keys()
                & {
                    "taxId",
                    "organismName",
                    "commonName",
                    "releaseDate",
                    "submitter",
                    "bioProjectAccession",
                    "biosampleAccession",
                }
            }
        )
