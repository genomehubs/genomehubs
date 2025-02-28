## Install prefect

[Install prefect](https://docs.prefect.io/v3/get-started/install) in a new conda environment

```
conda create -n prefect python=3.12
conda activate prefect
pip install -U prefect
```

## Set up a prefect server

Set up a [locally hosted prefect server](https://docs.prefect.io/v3/manage/self-host). Minimal config example, use prefect cloud or postgress-backed database in production.

```
conda activate prefect
prefect config set PREFECT_API_URL="http://127.0.0.1:4200/api"
prefect server start
```

## Create a `Process` work pool

[Create a work pool](https://docs.prefect.io/v3/tutorials/schedule#create-a-work-pool) on the prefect server, verify it exists and start polling for jobs

```
prefect work-pool create --type process goat-data
prefect work-pool ls
prefect worker start --pool goat-data
```

## Install genomehubs dependency

```
pip install genomehubs
```

## Set up s3 credentials

```
mkdir -p ~/.aws
nano ~/.aws/credentials

[default]
aws_access_key_id=XXXXXXXXXXXX
aws_secret_access_key=YYYYYYYYYYYYYYYYY
aws_endpoint_url=https://cog.sanger.ac.uk
```

```
nano ~/.aws/config

[default]
endpoint_url=https://cog.sanger.ac.uk
```

## deploy flows

```
git clone -b feature/assembly-pipelines --single-branch https://github.com/genomehubs/goat-data --depth 1
cd goat-data
prefect --no-prompt deploy --prefect-file flows/prefect.yaml --all
```

## Test locally

Set `SKIP_PREFECT` environment variable to run without Prefect API connection

```
SKIP_PREFECT=true python3 flows/lib/update_ncbi_datasets.py -r 9608 -f /tmp/assembly-data/ncbi_datasets_canidae.jsonl -s s3://goat/resources/assembly-data/ncbi_datasets_canidae.jsonl

SKIP_PREFECT=true python3 flows/lib/fetch_previous_file_pair.py -y ./sources/assembly-data/ncbi_datasets_eukaryota.types.yaml -s s3://goat/sources/assembly-data -w /tmp/assembly-data

SKIP_PREFECT=true python3 flows/lib/parse_ncbi_assemblies.py -j /tmp/assembly-data/ncbi_datasets_canidae.jsonl -y /tmp/assembly-data/ncbi_datasets_eukaryota.types.yaml -a

SKIP_PREFECT=true python3 flows/lib/wrapper_fetch_parse_validate.py -p ncbi_assemblies -y ./sources/assembly-data/ncbi_datasets_eukaryota.types.yaml -s s3://goat/sources/assembly-data -w /tmp/assembly-data -a

```

## set date as variable

```
crontab -e

0 0 * * * prefect variable set --overwrite date $(date '+%Y%m%d')
```
