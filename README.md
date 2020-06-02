# GenomeHubs-2-0

Making search the hub.

Main development effort will be in [genomehubs prerelease/v2.0](https://github.com/genomehubs/genomehubs/tree/prerelease/v2.0) to make sure release is in sensible repository.

## GenomeHubs 2.0 stack

### Core code
- Python3

### Search index
- Elasticsearch

### Web interface
- NodeJS
- React
- Redux
- Reselect
- Webpack
- Babel
- Sass
- d3

### Testing
- PyLint
- PyTest
- JSLint
- Jest
- Selenium
- Travis CI
- Circle CI

### Packaging/dependency management
- Docker/Singularity
- Conda
  - agat
  - nodejs

## Configuration

YAML format config file (as for BTK). Can be read by snakemake to run pipelined version of analysis/index or used directly by the command line options described in [Usage examples](#usage-examples).

### Default config file

```
run:
  interproscan:
    - option: value
    - option2: value2
  busco:
    - lineage: eukaryota_odb9

index:
  elasticsearch: http://localhost:9200

```

### Per-assembly config

Can all be in one file, or a config file can be auto-detected if in the assembly directory.

```
assembly:
  accession: GCA_000298335.1
  alias: DroAlb_1.0
  bioproject: PRJNA39511
  biosample: SAMN00003213
  level: scaffold
  scaffold-count: 26354
  span: 253560284
  prefix: ACVV01

submitter:
  lab: A Genome Lab
  url: https://example.com

taxon:
  name: Drosophila albomicans
  taxid: 7291
```

## Usage examples

*-- still to be implemented --*

### `genomehubs run`

Run analyses in Docker/Singularity or directly if commands are in PATH. Structured directory is default for input/output but `--in` and `--out` flags available.

using default settings if command is in path
```
genomehubs run --interproscan --dir /path/to/ASSEMBLY_NAME
```

default settings with docker
```
genomehubs run --interproscan --use-docker --dir /path/to/ASSEMBLY_NAME
```

more options
```
genomehubs run --interproscan \
               --configfile /path/to/config.json \
               --options '-dp'
               --dir /path/to/ASSEMBLY_NAME
               --in /path/to/assembly.fasta \
               --out /path/to/output/filename \
               --use-docker \
               --use-singularity \
```

Support for piping using `--in STDIN --out STDOUT`


### `genomehubs index`

Index genome and analysis files

for gff3 file
```
genomehubs index --gff3 /path/to/ASSEMBLY_NAME.gff3
```

more options, including preprocessing with `agat_sp_to_tabulated.pl`
```
genomehubs index --gff3 /path/to/ASSEMBLY_NAME.gff3 \
                 --elasticsearch http://localhost:9200 \
                 --template /path/to/templates/gff3.json \
                 --preprocess \
                 --configfile /path/to/config.json \
                 --index-name gff3-ASSEMBLY_NAME
```

Examples:
```
./genomehubs index --gff3 tests/files/gff3/ASM31383v2.gff --gff3 tests/files/gff3/ASM31383v2.gff --gff3 tests/files/gff3/ASM31383v2.gff --gff3 tests/files/gff3/ASM31383v2.gff --gff tests/files/gff3/MelCinx1.0.gff

./genomehubs index --species-tree tests/files/trees/test_species_tree.newick

./genomehubs index --gene-trees tests/files/trees/test_gene_trees
```

### `genomehubs search`

Find features in index.

```
./genomehubs search --taxon Lepidoptera --meta assembly.n50:gt:640000

./genomehubs search --species-tree-node test_species_tree
```

Tree node queries will work once tree_ids are added to assembly analyses (currently returns all assemblies for taxon regardless of whether in tree or not)
```
./genomehubs search --species-tree-node test_species_tree.node_2
./genomehubs search --species-tree-node test_species_tree.node_2

```

### `genomehubs launch`

Launch web tools. Uses separate config file as other files may contain passwords, and likely to be useful to run web tools on different host.

```
genomehubs launch --genomehubs
genomehubs launch --ensembl
genomehubs launch --sequenceserver
```

More options:
```
genomehubs launch --genomehubs
                  --configfile /path/to/launch.json
                  --port 1234
```
