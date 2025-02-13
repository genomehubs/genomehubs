#!/usr/bin/env python3
"""
Usage: GITHUB_REPOSITORY=genomehubs/genomehubs GITHUB_TOKEN=$(gh auth token --user rjchallis) python issue-labels.py
"""

import requests
import json
import os

if github_repository := os.getenv("GITHUB_REPOSITORY"):
    repo = f"https://api.github.com/repos/{github_repository}"
else:
    raise ValueError("GITHUB_REPOSITORY environment variable not set")


def colour_ramp (index, num_colours):
    """Generate a colour ramp"""
    # Define the source colours
    paired_colours = [
        "a6cee3", "1f78b4", "b2df8a", "33a02c", "fb9a99", "e31a1c", "fdbf6f", "ff7f00", "cab2d6", "6a3d9a", "ffff99", "b15928"
    ]

    start_colour = paired_colours[(index * 2 + 1) % len(paired_colours)]
    end_colour = paired_colours[(index * 2) % len(paired_colours)]
    
    def hex_to_rgb(hex):
        return tuple(int(hex[i:i+2], 16) for i in (0, 2, 4))
    
    def rgb_to_hex(rgb):
        return ''.join(f'{int(c):02x}' for c in rgb)
    
    start_rgb = hex_to_rgb(start_colour)
    end_rgb = hex_to_rgb(end_colour)
    
    ramp = []
    for i in range(num_colours):
        ratio = i / (num_colours - 1)
        intermediate_rgb = tuple(
            int(start_rgb[j] + (end_rgb[j] - start_rgb[j]) * ratio) for j in range(3)
        )
        ramp.append(rgb_to_hex(intermediate_rgb))
    
    return ramp

colour_sets = {
    "PROJECT": colour_ramp(0, 8),
    "PROCESS": colour_ramp(1, 8),
    "STACK": colour_ramp(2, 8),
    "REASON": colour_ramp(3, 8),
    "PRIORITY": colour_ramp(4, 8),
}

# Define the labels
label_sets = {
    "PROJECT": [
        {"name": "project:goat :goat:", "color": colour_sets["PROJECT"][0], "description": "Related to Genomes on a Tree (GOAT)"},
        {"name": "project:boat :rowboat:", "color": colour_sets["PROJECT"][1], "description": "Related to BUSCOs on a Tree (BOAT)"},
        {"name": "project:gap", "color": colour_sets["PROJECT"][2], "description": "Related to Genome After Party (GAP)"},
        {"name": "project:molluscdb :snail:", "color": colour_sets["PROJECT"][3], "description": "Related to MolluscDB"},
        {"name": "project:lepbase :butterfly:", "color": colour_sets["PROJECT"][4], "description": "Related to LepBase"},
    ],
    "PROCESS": [
        {"name": "process:curation", "color": colour_sets["PROCESS"][0], "description": "Data curation, including data cleaning and validation"},
        {"name": "process:import", "color": colour_sets["PROCESS"][1], "description": "Data import workflows"},
        {"name": "process:documentation", "color": colour_sets["PROCESS"][2], "description": "Documentation, tutorials and user guides"},
        {"name": "process:report", "color": colour_sets["PROCESS"][3], "description": "Data reporting, including requests for EBP project page updates"},
        {"name": "process:admin", "color": colour_sets["PROCESS"][4], "description": "Administrative tasks"},
        {"name": "process:outreach", "color": colour_sets["PROCESS"][5], "description": "User talks, presentations and demonstrations"},
        {"name": "process:integration", "color": colour_sets["PROCESS"][6], "description": "Integration with other resources"},
    ],
    "STACK": [
        {"name": "stack:genomehubs", "color": colour_sets["STACK"][0], "description": "Related to the core GenomeHubs codebase"},
        {"name": "stack:api", "color": colour_sets["STACK"][1], "description": "Related to the Application Programming Interface (API)"},
        {"name": "stack:cli", "color": colour_sets["STACK"][2], "description": "Related to the Command Line Interface (CLI)"},
        {"name": "stack:ui", "color": colour_sets["STACK"][3], "description": "Related to the web User Interface (UI)"},
        {"name": "stack:data", "color": colour_sets["STACK"][4], "description": "Related to the raw or processed data in a GenomeHubs instance"},
        {"name": "stack:elastic", "color": colour_sets["STACK"][5], "description": "Related to the underlying Elasticsearch search engine"},
        {"name": "stack:infrastructure", "color": colour_sets["STACK"][6], "description": "Related to infrastructure for running a GenomeHubs instance"},
        {"name": "stack:workflow", "color": colour_sets["STACK"][7], "description": "Related to data processing, validation, import, or release workflows"},
    ],
    "REASON": [
        {"name": "reason:bug", "color": colour_sets["REASON"][0], "description": "Bug reports, unexpected or incorrect behaviour"},
        {"name": "reason:enhancement", "color": colour_sets["REASON"][1], "description": "Enhancement requests, suggestions for new features or modifications to existing features"},
        {"name": "reason:question", "color": colour_sets["REASON"][2], "description": "Questions about how to use GenomeHubs or the data it provides"},
        {"name": "reason:discussion", "color": colour_sets["REASON"][3], "description": "General discussion or feedback"},
        {"name": "reason:accessibility", "color": colour_sets["REASON"][4], "description": "Accessibility issues"},
        {"name": "reason:epic", "color": colour_sets["REASON"][5], "description": "High level overview of tasks that are too large to be captured by a single issue"},
    ],
    "PRIORITY": [
        {"name": "priority:critical", "color": colour_sets["PRIORITY"][0], "description": "Critical priority, requires immediate attention"},
        {"name": "priority:high", "color": colour_sets["PRIORITY"][1], "description": "High priority, requires attention soon"},
        {"name": "priority:medium", "color": colour_sets["PRIORITY"][2], "description": "Medium priority, requires attention at some point"},
        {"name": "priority:low", "color": colour_sets["PRIORITY"][3], "description": "Low priority, may be addressed later or not at all"},
    ],
}

# Add the labels to the repository
for labels in label_sets.values():
    for label in labels:
        github_token = os.getenv("GITHUB_TOKEN")
        if not github_token:
            raise ValueError("GITHUB_TOKEN environment variable not set")

        response = requests.post(
            f"{repo}/labels",
            headers={
                "Authorization": f"token {github_token}",
                "Content-Type": "application/json",
            },
            data=json.dumps(label),
        )
        if response.status_code == 201:
            print(f"Label '{label['name']}' created successfully.")
        elif response.status_code == 422:
            print(f"Label '{label['name']}' already exists.")
            label["new_name"] = label.pop("name")
            new_response = requests.post(
                f"{repo}/labels/{label['new_name']}",
                headers={
                    "Authorization": f"token {github_token}",
                    "Content-Type": "application/json",
                },
                data=json.dumps(label),
            )
            if new_response.status_code == 200:
                print(f"Label '{label['new_name']}' updated successfully.")
            else:
                print(f"Failed to update label '{label['new_name']}': {new_response.content}")
        else:
            print(f"Failed to create label '{label['name']}': {response.content}")
