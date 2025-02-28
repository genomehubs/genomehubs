# genomehubs-data

Individual GenomeHubs sites have independent data processing and import pipelines. This directory is a place to collate common scripts and documentation to make it easier to reuse pipeline components across different sites.

The core pipelines are currently being redeveloped as outlined below:

## goat-data

The GoaT data pipeline is used for [goat.genomehubs.org](https://goat.genomehubs.org) and makes use of data and configuration files at [goat.cog.sanger.ac.uk](https://goat.cog.sanger.ac.uk) and [github.com/genomehubs/goat-data](https://github.com/genomehubs/goat-data), respectively.

```mermaid
flowchart TB

subgraph PrepareTaxdump
  direction TB
  FetchNCBITaxonomy -->|.dmp| ProcessTaxonomies
  FetchENATaxonomyExtra -->|.jsonl| ProcessTaxonomies
  FetchOTTTaxonomyNames -->|.tsv| ProcessTaxonomies
  FetchTolIDs -->|.tsv| ProcessTaxonomies
  ProcessTaxonomies --> ProcessedTaxdump@{shape: docs}
end

PrepareTaxdump --> ForEachInput

subgraph InitES
  direction LR
  ProcessedTaxdumpInit@{shape: docs, label: "ProcessedTaxdump"} --> GenomeHubsInit
  GenomeHubsInit --> SnapshotESIndex
  SnapshotESIndex --> ESSnapshotInit@{shape: db, label: "ESSnapshot"}
end

PrepareTaxdump --> InitES

subgraph ForEachInput

  direction LR
  subgraph UpdateFile
    UpdateInputFile
  end

  UpdateInputFile --> FetchParseValidate

  subgraph FetchParseValidate
    direction TB
    FetchPreviousFilePair --> ParseRawData
    ParseRawData --> ParsedFiles@{shape: docs}
    ParsedFiles --> UploadToS3
    ParsedFiles --> ValidateFilePair
    ProcessedTaxdumpFPV@{shape: docs, label: "ProcessedTaxdump"} --> ValidateFilePair{ValidateFilePair}
    ValidateFilePair -->|pass| UploadToS3
    ValidateFilePair -->|pass| ValidatedFiles@{shape: docs, label: "ValidatedFiles"}
  end

  subgraph SnapshotIndex
    SnapshotESIndexIndex[SnapshotESIndex]
    SnapshotESIndexIndex --> ESSnapshotIndex@{shape: db, label: "ESSnapshot"}
  end

  FetchParseValidate -->|pass| ImportES
  FetchParseValidate -->|fail| FetchPrevious

  subgraph ImportES
    direction TB
    ESSnapshot@{shape: db} --> RestoreFromSnapshot
    RestoreFromSnapshot --> GenomeHubsIndex
    ValidatedFilesImport@{shape: docs, label: "ValidatedFiles"} --> GenomeHubsIndex
    GenomeHubsIndex --> GenomeHubsTestImport{GenomeHubsTest}
    GenomeHubsTestImport
  end

  ImportES -->|pass| SnapshotIndex
  SnapshotIndex --> ImportES
  ImportES -->|fail| FetchPrevious


  subgraph FetchPrevious
    direction TB
    FetchPreviousFilePair2[FetchPreviousFilePair] --> ValidateFilePair2{ValidateFilePair}
    ProcessedTaxdumpFP@{shape: docs, label: "ProcessedTaxdump"} --> ValidateFilePair2
    ValidateFilePair2 -->|pass| ValidatedFiles2@{shape: docs, label: "ValidatedFiles"}
    ValidatedFiles2
  end

  FetchPrevious -->|pass| ImportES

end

InitES --> ForEachInput

subgraph Fill
  ESSnapshotFillIncoming@{shape: db, label: "ESSnapshot"} --> RestoreFromSnapshotFill[RestoreFromSnapshot]
  RestoreFromSnapshotFill --> GenomeHubsFill
  GenomeHubsFill --> GenomeHubsTestFill{GenomeHubsTest}
  GenomeHubsTestFill -->|pass| ESSnapshotFill@{shape: db, label: "ESSnapshot"}
end

ForEachInput --> Fill

subgraph FinishRelease
  direction TB
  subgraph TransferIndexes
    ESSnapshotProd@{shape: db, label: "ESSnapshot"} --> RsyncToProduction
    RsyncToProduction --> RestartGoaT
    ESSnapshotProd --> RsyncToLustre
    RsyncToLustre --> DeleteIndexes
  end

  subgraph UpdateS3
    CopyReleaseFilesToSources
  end

  
end

Fill -->|pass| FinishRelease

```

## taxdb-data

The TaxDB data pipeline is intended to be shared across [BoaT](https://boat.genomehubs.org) and related taxon DBs, including [MolluscDB](https://molluscdb.genomehubs.org), the soon to be updated [LepBase](https://lepbase.genomehubs.org) and the forthcoming IsopoDB.

```mermaid
flowchart TB

subgraph FetchResources
  direction TB
  FetchNCBITaxDump --> NCBITaxdump@{shape: docs, label: "NCBITaxdump\n_.dmp_"}
  FetchGoaTTargetList --> TargetTaxonList@{shape: doc, label: "TargetTaxonList\n_.tsv_"}
  FetchGoaTTargetList --> TargetAccessionList@{shape: doc, label: "TargetAccessionList\n_.tsv_"}
end

subgraph ForEachAccession
  direction TB
  SnapshotExists{SnapshotExists} -->|yes| ESSnapshot@{shape: db, label: "ESSnapshot\n_features_"}
  SnapshotExists -->|no| FindFiles@{label: "FindFiles\n_GAP/TaxDB/Lustre_"}
  FindFiles --> FilesExist{FilesExist}
  FilesExist -->|no| RunBlobToolKit
  FilesExist -->|yes| BuscoFiles@{shape: docs, label: "Busco\n_fulltable.tsv_"}
  FilesExist -->|yes| BlobToolKitFiles@{shape: docs, label: "BlobToolKit\n_window_stats.tsv_"}
  BuscoFiles --> ProcessFeatures
  BlobToolKitFiles --> ProcessFeatures
  ProcessFeatures --> GHubsFilePairs@{shape: docs, label: "GHubsFilePairs\n_.yaml_\n_.tsv_"}
  GenomehubsInit --> GenomeHubsImport
  GHubsFilePairs --> GenomeHubsImport
  GenomeHubsImport --> SnapshotIndex
  SnapshotIndex --> ESSnapshot
  ESSnapshot --> UpdateAvailableTaxonList
  UpdateAvailableTaxonList --> AvailableTaxonList@{shape: doc, label: "AvailableTaxonList\n_.tsv_"}
end

subgraph FetchAssemblyMetadata
direction TB
  FilteredTaxonListFetchAM@{shape: doc, label: "FilteredTaxonList\n_.tsv_"} --> FetchAssemblyReport
  FetchAssemblyReport --> ParseAssemblyReport
  ParseAssemblyReport -->
  ValidateAssemblyData
  ValidateAssemblyData --> GHubsFilePairFetchAM@{shape: docs, label: "GHubsFilePairs\n_.yaml_\n_.tsv_"}
end

subgraph ForEachTaxDB


subgraph FilterTaxonList
  direction TB
  FetchGoaTTargetListTaxDB[FetchGoaTTargetList] --> FilterTargetLists
  AvailableTaxonListTaxDB@{shape: doc, label: "AvailableTaxonList\n_.tsv_"} --> FilterTargetLists
  AvailableAccessionListTaxDB@{shape: doc, label: "AvailableAccessionList\n_.tsv_"} --> FilterTargetLists
  FilterTargetLists --> FilteredTaxonList@{shape: doc, label: "FilteredTaxonList\n_.tsv_"}
  FilterTargetLists --> FilteredAccessionList@{shape: doc, label: "FilteredAccessionList\n_.tsv_"}
end

subgraph CreateDatabase
  direction TB
  NCBITaxdumpCreateDB@{shape: docs, label: "NCBITaxdump\n_.dmp_"} --> FilterNCBITaxdump
  FilteredTaxonListCreateDB@{shape: doc, label: "FilteredTaxonList\n_.tsv_"} --> FilterNCBITaxdump
  FilteredAccessionListCreateDB@{shape: doc, label: "FilteredAccessionList\n_.tsv_"} --> ForEachTargetAccession
  FilterNCBITaxdump --> FilteredTaxdump@{shape: docs, label: "FilteredTaxdump\n_.dmp_"}
  FilteredTaxdump --> GenomeHubsInitCreateDB[GenomeHubsInit]

  GenomeHubsInitCreateDB --> GenomeHubsImportCreateDB[GenomeHubsImport]
  GHubsFilePairCreateDB@{shape: docs, label: "GHubsFilePairs\n_.yaml_\n_.tsv_"} --> GenomeHubsImportCreateDB
  GenomeHubsImportCreateDB --> ForEachTargetAccession
  subgraph ForEachTargetAccession
  ESSnapshotCreateDB@{shape: db, label: "ESSnapshot\n_features_"}
  ESSnapshotCreateDB --> LoadSnapshot
  LoadSnapshot --> ReIndexFeatures
  end
  ForEachTargetAccession --> GenomeHubsFill
  GenomeHubsFill --> ESSnapshotFill@{shape: db, label: "ESSnapshot\n_fill_"}
end

FilterTaxonList --> CreateDatabase

subgraph TransferIndexes
  ESSnapshotProd@{shape: db, label: "ESSnapshot\n_fill_"} --> RsyncToProduction
  RsyncToProduction --> RestartTaxDB
  ESSnapshotProd --> RsyncToLustre
  RsyncToLustre --> DeleteIndexes
end

end

FetchResources --> ForEachTaxDB
FetchResources --> ForEachAccession
ForEachAccession --> ForEachTaxDB
FetchAssemblyMetadata --> ForEachTaxDB
CreateDatabase --> TransferIndexes
```

### FetchResources

#### FetchGoatTargetList

Generate `taxon_list.tsv` with:
```
SKIP_PREFECT=true python3 src/data/flows/lib/fetch_goat_target_list.py -q "query:tax_rank(species) AND assembly_level>=chromosome&fields:none"
```

Generate `assembly_list.tsv` with:
```
SKIP_PREFECT=true python3 src/data/flows/lib/fetch_goat_target_list.py -q "query:tax_rank(species) AND assembly_level=chromosome AND refseq_category&fields:none" -x assembly
```