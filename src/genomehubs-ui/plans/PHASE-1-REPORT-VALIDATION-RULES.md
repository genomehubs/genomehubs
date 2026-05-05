# Phase 1: Report Query Validation Rules (BLOCKER for Phase 2)

**Status**: Phase 1 - Critical Documentation  
**Last Updated**: May 2026  
**Purpose**: Lock down all 35+ validation rules from `sortReportQuery()` before Phase 2 adapter work  
**File Reference**: `src/client/views/selectors/report.js:34-160`

---

## Overview

`sortReportQuery()` is the **authoritative validator** for report parameters. It:

1. Filters parameters by report type
2. Maps UI parameter names to API names
3. Excludes incompatible parameters
4. Controls UI-only vs API-level filtering

**Critical Constraint**: All Phase 2 report adapter work depends on these rules being locked down.

---

## Report Types

| Type      | Purpose                         | Supported |
| --------- | ------------------------------- | --------- |
| tree      | Phylogenetic tree visualization | ✅ P0     |
| histogram | Distribution histograms         | ✅ P0     |
| map       | Geographic map visualization    | ✅ P0     |
| scatter   | Scatter plot (2D/3D)            | ✅ P0     |
| arc       | Arc/ribbon diagram              | ✅ P0     |
| table     | Data table display              | ✅ P0     |
| oxford    | Oxford grid visualization       | ✅ P0     |
| ribbon    | Ribbon diagram (hierarchical)   | ✅ P0     |
| sources   | Data sources listing            | ✅ P0     |

---

## Parameter Categories

### Category 1: Universal Parameters (Always Accepted)

These parameters are valid for **ALL report types**:

| Parameter                 | Type    | Purpose                                      | Default  |
| ------------------------- | ------- | -------------------------------------------- | -------- |
| `result`                  | string  | Data result type (taxon, assembly, etc.)     | Required |
| `report`                  | string  | Report type (tree, histogram, map, etc.)     | Required |
| `query` / `x`             | string  | Primary query (may be aliased)               | Required |
| `includeEstimates`        | boolean | Include estimated values                     | false    |
| `excludeAncestral`        | boolean | Exclude ancestral lineages                   | false    |
| `excludeDescendant`       | boolean | Exclude descendant lineages                  | false    |
| `excludeMissing`          | boolean | Exclude records with missing data            | false    |
| `excludeDirect`           | boolean | Exclude direct/self matches                  | false    |
| `taxonomy`                | string  | Taxonomy version to use                      | current  |
| `caption`                 | string  | User-provided chart caption                  | none     |
| `queryA` through `queryJ` | string  | Alternative query strings (up to 10 queries) | none     |
| `release`                 | string  | API release version                          | latest   |
| `indent`                  | boolean | Indent output (internal flag)                | false    |

**Test Cases**:

- `report=tree&query=Homo&includeEstimates=true` ✅
- `report=histogram&query=Homo&taxonomy=ncbi` ✅
- `report=map&query=Homo&release=v1` ✅

---

### Category 2: Report-Specific Required Parameters

| Report Type | Required Parameters | Optional Parameters                                                                                                    |
| ----------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| tree        | query, result       | y, z, rank, ranks, levels, names, fields                                                                               |
| histogram   | query, result       | fields, xOpts, yOpts, compactLegend, catToX, compactWidth, yScale, stacked, cumulative                                 |
| map         | query, result       | locationField, regionField, geoBounds, mapThreshold, mapType, mapTheme, mapProjection, geoBinResolution                |
| scatter     | query, result       | y, z, xOpts, yOpts, compactLegend, compactWidth, highlightArea, scatterThreshold, zScale, stacked, pointSize, reversed |
| arc         | query, result       | y, z, cat, pointSize                                                                                                   |
| table       | query, result       | y, fields, xOpts, yOpts, highlight, cumulative                                                                         |
| oxford      | query, result       | rank, fields, compactLegend, reorient, compactWidth, plotRatio, pointSize                                              |
| ribbon      | query, result       | rank, fields, compactLegend, reorient, dropShadow, compactWidth, plotRatio, pointSize                                  |
| sources     | query, result       | fields                                                                                                                 |

---

### Category 3: Report-Specific Filtering Rules

Each parameter has constraints defining which reports accept it.

#### Rule 1: Axes Parameters (x, y, z)

| Parameter               | Allowed Reports           | Constraint      | Purpose            |
| ----------------------- | ------------------------- | --------------- | ------------------ |
| `x` (alias for `query`) | All except sources        | Not sources     | Primary axis       |
| `y`                     | scatter, table, tree, arc | Exactly these 4 | Secondary axis     |
| `z`                     | scatter, arc              | Exactly these 2 | Tertiary axis (3D) |

**Exclusion Rule**: `x` cannot be used with source/srces report type
**Alias Rule**: `query` parameter is aliased to `x` for API calls

**Test Cases**:

- `report=tree&x=Homo` ✅ (alias works)
- `report=scatter&y=assembly_level&z=gc_content` ✅
- `report=sources&x=Homo` ❌ (INVALID)
- `report=histogram&y=count` ❌ (y not allowed for histogram)

---

#### Rule 2: Categorical Parameters (cat, rank, ranks)

| Parameter | Allowed Reports                        | Constraint                           | Purpose                        |
| --------- | -------------------------------------- | ------------------------------------ | ------------------------------ |
| `cat`     | All except sources, arc                | Not in {sources, arc}                | Categorical grouping           |
| `rank`    | All except oxford, ribbon, srces, tree | Not in {oxford, ribbon, srces, tree} | Taxonomic rank                 |
| `ranks`   | tree                                   | Exactly tree                         | Multiple ranks (tree-specific) |

**Test Cases**:

- `report=histogram&cat=assembly_status` ✅
- `report=table&rank=species` ✅
- `report=tree&rank=species` ❌ (rank not allowed for tree; use ranks instead)
- `report=tree&ranks=species,genus` ✅

---

#### Rule 3: Tree-Specific Parameters

| Parameter           | Allowed Reports | UI Only? | API Name            | Purpose                        |
| ------------------- | --------------- | -------- | ------------------- | ------------------------------ |
| `names`             | tree            | No       | names               | Include taxon names            |
| `levels`            | tree            | Yes      | (excluded from API) | Display level indicator        |
| `collapseMonotypic` | tree            | No       | collapseMonotypic   | Collapse single-child nodes    |
| `hideSourceColors`  | tree            | Yes      | (excluded from API) | Hide source color coding       |
| `hideErrorBars`     | tree            | Yes      | (excluded from API) | Hide confidence intervals      |
| `hideAncestralBars` | tree            | Yes      | (excluded from API) | Hide ancestral indicators      |
| `showPhylopics`     | tree            | Yes      | (excluded from API) | Show phylopic images           |
| `phylopicRank`      | tree            | Yes      | preserveRank        | Rank to preserve for phylopics |
| `phylopicSize`      | tree            | Yes      | (excluded from API) | Size of phylopic images        |
| `treeStyle`         | tree            | Yes      | (excluded from API) | Tree layout style              |
| `treeThreshold`     | tree            | No       | treeThreshold       | Minimum nodes for rendering    |

**Important**: Some parameters are UI-only (excluded when `ui=false`):

- `levels`, `hideSourceColors`, `hideErrorBars`, `hideAncestralBars`, `showPhylopics`, `phylopicSize`, `treeStyle`

**Test Cases**:

- `report=tree&names=true` ✅ (API receives)
- `report=tree&levels=3&ui=false` ❌ (excluded because ui=false)
- `report=tree&collapseMonotypic=true` ✅
- `report=histogram&treeStyle=radial` ❌ (not a tree report)

---

#### Rule 4: Histogram-Specific Parameters

| Parameter       | Allowed Reports                    | UI Only? | Purpose                          |
| --------------- | ---------------------------------- | -------- | -------------------------------- |
| `xOpts`         | histogram, scatter, table          | No       | X-axis display options           |
| `yOpts`         | scatter, table, tree               | No       | Y-axis display options           |
| `compactLegend` | histogram, oxford, ribbon, scatter | No       | Compact legend display           |
| `catToX`        | histogram                          | No       | Map categorical to X-axis        |
| `compactWidth`  | histogram, oxford, ribbon, scatter | No       | Compact width setting            |
| `yScale`        | histogram                          | Yes      | Y-axis scale (log, linear, etc.) |
| `stacked`       | histogram, scatter                 | Yes      | Stacked display                  |
| `cumulative`    | histogram, table                   | Yes      | Cumulative sum display           |

**Test Cases**:

- `report=histogram&xOpts=auto&yScale=log` ✅
- `report=scatter&xOpts=auto&stacked=true` ✅
- `report=tree&xOpts=auto` ❌ (xOpts not for tree)

---

#### Rule 5: Scatter-Specific Parameters

| Parameter          | Allowed Reports                               | UI Only? | Purpose                  |
| ------------------ | --------------------------------------------- | -------- | ------------------------ |
| `highlightArea`    | scatter                                       | Yes      | Highlight area/region    |
| `scatterThreshold` | scatter                                       | No       | Minimum points to render |
| `zScale`           | scatter                                       | Yes      | Z-axis scale (for 3D)    |
| `pointSize`        | histogram, oxford, ribbon, scatter, tree, arc | Yes      | Point size               |
| `reversed`         | scatter                                       | Yes      | Reverse axis             |

**Test Cases**:

- `report=scatter&z=genome_size&zScale=log` ✅
- `report=scatter&pointSize=5&highlightArea=species_a` ✅

---

#### Rule 6: Map-Specific Parameters

| Parameter          | Allowed Reports | Purpose                                   |
| ------------------ | --------------- | ----------------------------------------- |
| `mapThreshold`     | map             | Minimum data points to render             |
| `locationField`    | map             | Field containing coordinates              |
| `regionField`      | map             | Field containing region info              |
| `geoBounds`        | map             | Geographic boundaries                     |
| `mapType`          | map             | Map layer type (satellite, terrain, etc.) |
| `mapTheme`         | map             | Color theme for map                       |
| `mapProjection`    | map             | Map projection (mercator, albers, etc.)   |
| `geoBinResolution` | map             | Resolution for geographic binning         |

**Test Cases**:

- `report=map&mapType=satellite&mapTheme=dark` ✅
- `report=map&geoBinResolution=10` ✅
- `report=histogram&mapType=satellite` ❌ (not a map report)

---

#### Rule 7: Oxford Grid & Ribbon Parameters

| Parameter    | Allowed Reports         | Purpose                |
| ------------ | ----------------------- | ---------------------- |
| `reorient`   | oxford, ribbon          | Reorient layout        |
| `dropShadow` | ribbon                  | Add drop shadow effect |
| `plotRatio`  | oxford, ribbon, scatter | Aspect ratio           |

**Test Cases**:

- `report=oxford&reorient=true&plotRatio=1.5` ✅
- `report=ribbon&dropShadow=true` ✅

---

#### Rule 8: Table-Specific Parameters

| Parameter    | Allowed Reports  | Purpose                          |
| ------------ | ---------------- | -------------------------------- |
| `highlight`  | table            | Highlight rows matching criteria |
| `cumulative` | histogram, table | Show cumulative totals           |

**Test Cases**:

- `report=table&highlight=rank:species` ✅

---

#### Rule 9: Arc Diagram Parameters

| Parameter   | Allowed Reports                               | Purpose                 |
| ----------- | --------------------------------------------- | ----------------------- |
| `cat`       | All except sources, arc                       | Cannot use cat with arc |
| `y`         | scatter, table, tree, arc                     | Secondary axis          |
| `z`         | scatter, arc                                  | Tertiary axis           |
| `pointSize` | histogram, oxford, ribbon, scatter, tree, arc | Point size              |

**Test Cases**:

- `report=arc&y=metric&z=value&pointSize=3` ✅
- `report=arc&cat=group` ❌ (cat not allowed for arc)

---

### Category 4: Field/Column Selection Parameters

| Parameter | Allowed Reports                                               | Purpose                                   |
| --------- | ------------------------------------------------------------- | ----------------------------------------- |
| `fields`  | histogram, map, oxford, ribbon, scatter, sources, table, tree | Comma-separated list of fields to include |

**Not allowed for**: (none - check code) - Actually checking again, `fields` is not allowed for arc report based on line 51 which excludes sources from the full list

**Test Cases**:

- `report=tree&fields=scientific_name,taxon_rank,genome_size` ✅
- `report=histogram&fields=gc_content,genome_length` ✅

---

### Category 5: Threshold & Scale Parameters

| Parameter          | Allowed Reports                                           | Purpose                          | Default        |
| ------------------ | --------------------------------------------------------- | -------------------------------- | -------------- |
| `queryId`          | histogram, map, oxford, ribbon, scatter, table, tree, arc | Query ID for progress tracking   | auto-generated |
| `treeThreshold`    | tree                                                      | Minimum nodes for tree rendering | configurable   |
| `mapThreshold`     | map                                                       | Minimum data points for map      | configurable   |
| `scatterThreshold` | scatter                                                   | Minimum points for scatter       | configurable   |

**Test Cases**:

- `report=tree&treeThreshold=100` ✅
- `report=map&mapThreshold=10` ✅

---

### Category 6: Color & Display Parameters

| Parameter      | Allowed Reports    | Excluded Reports | UI Only? | Purpose                        |
| -------------- | ------------------ | ---------------- | -------- | ------------------------------ |
| `colorPalette` | All except sources | sources          | Yes      | Color scheme for visualization |

**Test Cases**:

- `report=tree&colorPalette=default` ✅
- `report=sources&colorPalette=dark` ❌ (not for sources)

---

## Validation Logic (Source Code)

### Algorithm

```javascript
sortReportQuery({ queryString, options, ui = true }) {
  // Step 1: Parse query string if options not provided
  if (!options) {
    options = qs.parse(queryString);
  }

  // Step 2: Extract report type
  let { report } = options;

  // Step 3: For each parameter in options:
  Object.entries(options).forEach(([key, value]) => {
    // A) Check if parameter is known (in reportTerms)
    if (reportTerms[key]) {

      // B) If always allowed (value === true), include it
      if (reportTerms[key] === true) {
        newOptions[key] = value;
      }
      // C) If report-specific constraint:
      else if (ui || !reportTerms[key].ui) {
        let newKey = reportTerms[key].as || key;  // Apply alias if exists

        // D) If "in" constraint: only allow for specific reports
        if (reportTerms[key].in) {
          if (reportTerms[key].in.has(report)) {
            newOptions[newKey] = value;
          }
        }
        // E) If "not" constraint: exclude for specific reports
        else if (!reportTerms[key].not.has(report)) {
          newOptions[newKey] = value;
        }
      }

      // F) If API mapping exists and ui=false, apply it
      if (!ui && reportTerms[key].api) {
        newOptions[reportTerms[key].api] = value;
      }
    }
    // G) If unknown parameter, exclude it (silently dropped)
  });

  return qs.stringify(newOptions);
}
```

### Key Decision Points

1. **UI vs API Mode** (`ui` parameter)
   - `ui=true`: Include UI-only parameters in output
   - `ui=false`: Exclude UI-only parameters from output (for API calls)

2. **Parameter Aliasing**
   - `query` → `x` (UI name maps to API name)
   - `phylopicRank` → `preserveRank` (UI name maps to API name)

3. **Report-Specific Constraints**
   - "in" constraints: Parameter ONLY valid for these reports
   - "not" constraints: Parameter valid for ALL EXCEPT these reports

4. **Unknown Parameters**
   - Silently dropped (no error, just excluded)

---

## Edge Cases & Special Handling

### Edge Case 1: Multi-Query (queryA-queryJ)

**Constraint**: All 10 query parameters (queryA through queryJ) are **always accepted** for all reports.

**Purpose**: Allow multi-series comparisons in single visualization.

**Test Cases**:

- `report=histogram&query=Homo&queryA=Mus&queryB=Rattus` ✅
- `report=tree&query=Homo&queryA=null` ✅ (null values allowed)

---

### Edge Case 2: X-Parameter Alias

**Rule**:

- In UI: parameter named `query`
- In API call: parameter named `x`
- No mapping for reports where `x` is excluded (sources, srces)

**Code**:

```javascript
{ query: { not: new Set(["srces"]), as: "x" } }
```

**Test Cases**:

- UI: `report=tree&query=Homo` → API: `report=tree&x=Homo` ✅
- UI: `report=sources&query=Homo` ❌ (INVALID - sources excluded)

---

### Edge Case 3: Threshold Auto-Population

**In fetchReport() (lines 164-170)**:

- If `report=tree` and no `treeThreshold` provided, **auto-add** `treeThreshold` from store
- If `report=map` and no `mapThreshold` provided, **auto-add** `mapThreshold` from store

**Code**:

```javascript
if (queryString.match("report=tree") && !queryString.match("treeThreshold")) {
  queryString += `&treeThreshold=${treeThreshold}`;
}
if (queryString.match("report=map") && !queryString.match("mapThreshold")) {
  queryString += `&mapThreshold=${mapThreshold}`;
}
```

**Test Cases**:

- `report=tree&query=Homo` → Auto-appends `treeThreshold` ✅
- `report=map&query=Homo` → Auto-appends `mapThreshold` ✅

---

## Complete Parameter-to-Report Matrix

| Parameter         | tree | histogram | map  | scatter | arc  | table | oxford | ribbon | sources |
| ----------------- | ---- | --------- | ---- | ------- | ---- | ----- | ------ | ------ | ------- |
| result            | ✅   | ✅        | ✅   | ✅      | ✅   | ✅    | ✅     | ✅     | ✅      |
| report            | ✅   | ✅        | ✅   | ✅      | ✅   | ✅    | ✅     | ✅     | ✅      |
| query/x           | ✅   | ✅        | ✅   | ✅      | ✅   | ✅    | ✅     | ✅     | ❌      |
| y                 | ✅   | ❌        | ❌   | ✅      | ✅   | ✅    | ❌     | ❌     | ❌      |
| z                 | ❌   | ❌        | ❌   | ✅      | ✅   | ❌    | ❌     | ❌     | ❌      |
| cat               | ❌   | ✅        | ✅   | ✅      | ❌   | ✅    | ✅     | ✅     | ✅      |
| rank              | ❌   | ✅        | ✅   | ✅      | ✅   | ✅    | ❌     | ❌     | ✅      |
| ranks             | ✅   | ❌        | ❌   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| names             | ✅   | ❌        | ❌   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| fields            | ✅   | ✅        | ✅   | ✅      | ❌   | ✅    | ✅     | ✅     | ✅      |
| levels            | ✅\* | ❌        | ❌   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| collapseMonotypic | ✅   | ❌        | ❌   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| hideSourceColors  | ✅\* | ❌        | ❌   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| hideErrorBars     | ✅\* | ❌        | ❌   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| hideAncestralBars | ✅\* | ❌        | ❌   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| showPhylopics     | ✅\* | ❌        | ❌   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| phylopicRank      | ✅\* | ❌        | ❌   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| phylopicSize      | ✅\* | ❌        | ❌   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| treeStyle         | ✅\* | ❌        | ❌   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| treeThreshold     | ✅   | ❌        | ❌   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| xOpts             | ❌   | ✅        | ❌   | ✅      | ❌   | ✅    | ❌     | ❌     | ❌      |
| yOpts             | ✅   | ❌        | ❌   | ✅      | ❌   | ✅    | ❌     | ❌     | ❌      |
| compactLegend     | ❌   | ✅        | ❌   | ✅      | ❌   | ❌    | ✅     | ✅     | ❌      |
| catToX            | ❌   | ✅        | ❌   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| compactWidth      | ❌   | ✅        | ❌   | ✅      | ❌   | ❌    | ✅     | ✅     | ❌      |
| yScale            | ❌   | ✅\*      | ❌   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| stacked           | ❌   | ✅\*      | ❌   | ✅\*    | ❌   | ❌    | ❌     | ❌     | ❌      |
| cumulative        | ❌   | ✅\*      | ❌   | ❌      | ❌   | ✅\*  | ❌     | ❌     | ❌      |
| highlightArea     | ❌   | ❌        | ❌   | ✅\*    | ❌   | ❌    | ❌     | ❌     | ❌      |
| scatterThreshold  | ❌   | ❌        | ❌   | ✅      | ❌   | ❌    | ❌     | ❌     | ❌      |
| zScale            | ❌   | ❌        | ❌   | ✅\*    | ❌   | ❌    | ❌     | ❌     | ❌      |
| pointSize         | ✅\* | ❌        | ❌   | ✅\*    | ✅\* | ❌    | ✅\*   | ✅\*   | ❌      |
| reversed          | ❌   | ❌        | ❌   | ✅\*    | ❌   | ❌    | ❌     | ❌     | ❌      |
| mapThreshold      | ❌   | ❌        | ✅   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| locationField     | ❌   | ❌        | ✅   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| regionField       | ❌   | ❌        | ✅   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| geoBounds         | ❌   | ❌        | ✅   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| mapType           | ❌   | ❌        | ✅\* | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| mapTheme          | ❌   | ❌        | ✅\* | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| mapProjection     | ❌   | ❌        | ✅\* | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| geoBinResolution  | ❌   | ❌        | ✅   | ❌      | ❌   | ❌    | ❌     | ❌     | ❌      |
| reorient          | ❌   | ❌        | ❌   | ❌      | ❌   | ❌    | ✅     | ✅     | ❌      |
| dropShadow        | ❌   | ❌        | ❌   | ❌      | ❌   | ❌    | ❌     | ✅\*   | ❌      |
| plotRatio         | ❌   | ❌        | ❌   | ✅\*    | ❌   | ❌    | ✅\*   | ✅\*   | ❌      |
| colorPalette      | ✅\* | ✅\*      | ✅\* | ✅\*    | ✅\* | ✅\*  | ✅\*   | ✅\*   | ❌      |
| highlight         | ❌   | ❌        | ❌   | ❌      | ❌   | ✅\*  | ❌     | ❌     | ❌      |

**Legend**: ✅ = Allowed | ❌ = Not Allowed | ✅\* = Allowed (UI-only, excluded from API calls when ui=false)

---

## Test Suite (Phase 1 Implementation)

### File Location

`src/client/views/selectors/__tests__/report-validation.test.js`

### Test 1: Universal Parameters Always Pass

```javascript
test("universal parameters accepted for all report types", () => {
  const reports = [
    "tree",
    "histogram",
    "map",
    "scatter",
    "arc",
    "table",
    "oxford",
    "ribbon",
    "sources",
  ];

  reports.forEach((report) => {
    const result = sortReportQuery({
      queryString: `report=${report}&query=Homo&includeEstimates=true&taxonomy=ncbi`,
      ui: true,
    });

    expect(result).toContain("query=Homo");
    expect(result).toContain("includeEstimates=true");
    expect(result).toContain("taxonomy=ncbi");
  });
});
```

### Test 2: Axes Constraints

```javascript
test("y and z parameters only allowed for specific reports", () => {
  // Y allowed for: scatter, table, tree, arc
  expect(
    sortReportQuery({ queryString: "report=tree&query=Homo&y=metric" }),
  ).toContain("y=metric");
  expect(
    sortReportQuery({ queryString: "report=histogram&query=Homo&y=metric" }),
  ).not.toContain("y=metric");

  // Z allowed for: scatter, arc
  expect(
    sortReportQuery({ queryString: "report=scatter&query=Homo&z=value" }),
  ).toContain("z=value");
  expect(
    sortReportQuery({ queryString: "report=tree&query=Homo&z=value" }),
  ).not.toContain("z=value");
});
```

### Test 3: Tree-Specific Parameters

```javascript
test("tree-specific parameters excluded from non-tree reports", () => {
  expect(
    sortReportQuery({
      queryString: "report=tree&query=Homo&collapseMonotypic=true",
    }),
  ).toContain("collapseMonotypic=true");

  expect(
    sortReportQuery({
      queryString: "report=histogram&query=Homo&collapseMonotypic=true",
    }),
  ).not.toContain("collapseMonotypic=true");
});
```

### Test 4: UI-Only Parameters

```javascript
test("UI-only parameters excluded when ui=false", () => {
  const withUI = sortReportQuery({
    queryString: "report=tree&query=Homo&levels=3&hideSourceColors=true",
    ui: true,
  });
  expect(withUI).toContain("levels=3");
  expect(withUI).toContain("hideSourceColors=true");

  const withoutUI = sortReportQuery({
    queryString: "report=tree&query=Homo&levels=3&hideSourceColors=true",
    ui: false,
  });
  expect(withoutUI).not.toContain("levels=3");
  expect(withoutUI).not.toContain("hideSourceColors=true");
});
```

### Test 5: Parameter Aliasing

```javascript
test("query aliased to x, phylopicRank aliased to preserveRank", () => {
  const result = sortReportQuery({
    queryString: "report=tree&query=Homo&phylopicRank=species",
    ui: false, // API mode
  });

  expect(result).toContain("x=Homo");
  expect(result).not.toContain("query=Homo");
  expect(result).toContain("preserveRank=species");
  expect(result).not.toContain("phylopicRank=species");
});
```

### Test 6: Invalid Parameters Silently Dropped

```javascript
test("unknown parameters silently excluded", () => {
  const result = sortReportQuery({
    queryString: "report=tree&query=Homo&unknownParam=value&anotherFake=123",
  });

  expect(result).toContain("query=Homo");
  expect(result).not.toContain("unknownParam");
  expect(result).not.toContain("anotherFake");
});
```

### Test 7: QueryA-QueryJ Multi-Query

```javascript
test("all queryA-queryJ parameters accepted for all reports", () => {
  const result = sortReportQuery({
    queryString:
      "report=histogram&query=Homo&queryA=Mus&queryB=Rattus&queryC=Oryctolagus",
  });

  expect(result).toContain("query=Homo");
  expect(result).toContain("queryA=Mus");
  expect(result).toContain("queryB=Rattus");
  expect(result).toContain("queryC=Oryctolagus");
});
```

### Test 8: Query Alias Exclusion for Sources

```javascript
test("query/x parameter excluded for sources report", () => {
  expect(
    sortReportQuery({
      queryString: "report=sources&query=Homo",
    }),
  ).not.toContain("query=Homo");
});
```

---

## Phase 1 Exit Criteria

- [ ] All 40+ parameters documented in matrix above
- [ ] All validation rules extracted and categorized
- [ ] 8 test cases implemented and passing
- [ ] Edge cases documented (aliasing, UI mode, auto-population, etc.)
- [ ] Matrix verified against live code
- [ ] Ready for Phase 2 adapter developer reference

---

## Phase 2 Dependency

**Blocking**: Phase 2 report adapter implementation cannot start until this document is signed off.

**Use Cases**:

1. **Report Builder Adapter** (PHASE2-URL-004): Must implement these exact rules
2. **Report SDK Migration** (PHASE6-REPORT-002): Must maintain these constraints
3. **Schema Validation** (Future): Can be extracted into JSON schema

---

## References

- Source: `src/client/views/selectors/report.js:34-160`
- Auto-Population: `src/client/views/selectors/report.js:164-170`
- Related: `PHASE-1-FETCH-INVENTORY.md` (report fetch sites)
- Related: `PHASE-1-URL-INVENTORY.md` (report URL composition)
