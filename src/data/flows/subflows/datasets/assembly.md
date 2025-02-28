# Fetch and parse INSDC assembly metadata

```mermaid
flowchart TD

    subgraph Update NCBI datasets
    FetchCli["Fetch datasets CLI"]
    -->
    FetchJsonl["Fetch metadata JSONL"]
    -->
    CompareJsonMd5["Compare JSONL MD5 hash with version on S3"]
    end

    CompareJsonMd5
    -->
    Md5Matches{"MD5 matches?"}
    -- Yes -->
    End

    Md5Matches
    -- No -->
    FetchS3Tsv["Fetch previous TSV from S3"]

    subgraph Fetch previous TSV
    FetchS3Tsv
    -->
    CheckHeaders["Compare TSV and YAML headers"]
    end

    CheckHeaders
    -->HeadersMatch{"Headers match?"}
    -- Yes -->
    PartialParse["Parse new assemblies"]
    -->
    Validate["Validate YAML/TSV pair"]

    HeadersMatch
    -- No -->
    FullParse["Parse all assemblies"]
    -->
    Validate

    subgraph Parse assembly metadata
    PartialParse
    FullParse
    end

    subgraph Validate TSV/YAML pair
    Validate
    end

    Validate
    -->
    IsValid{"Is valid?"}
    -- No -->
    End

    IsValid
    -- Yes --> CopyToS3["Copy JSONL & TSV files to S3"]
    -->
    End

    subgraph Copy to S3
    CopyToS3
    end
```

## Install `datasets` CLI

```
curl -L https://ftp.ncbi.nlm.nih.gov/pub/datasets/command-line/v2/linux-amd64/datasets > datasets
chmod 755 datasets
```

## Install `s3cmd` CLI

```

```
