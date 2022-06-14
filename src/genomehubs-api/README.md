# GeonomeHubs API

An OpenAPI implementation for GenomeHubs

## Install

```
conda create -n ghubs_web_env -c conda-forge -y nodejs=14
conda activate ghubs_web_env
```

```
git clone https://github.com/genomehubs/genomehubs-api
cd genomehubs-api
npm install --legacy-peer-deps
npm start
```

## Usage

```
curl http://localhost:3000/api/v2/taxon/3702?indent=2
```

## Docs

- [GenomeHubs API docs](http://localhost:3000/api-docs)
- [GenomeHubs API spec](http://localhost:3000/spec)
