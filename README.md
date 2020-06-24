# GenomeHubs-2-0

Making search the hub.

Python3, Elasticsearch, React/Redux

## Quick start

Create separate Conda environments for command line and web front end:
```
conda create -n ghubs_env -c conda-forge -y defusedxml docker-py docopt elasticsearch ete3 python=3.8 psutil pyyaml tqdm ujson

conda create -n ghubs_web_env -c conda-forge -y nodejs=14
```

Git clone the prerelease/v2.0 branch from the GenomeHubs repository:
```
git clone -b prerelease/v2.0 https://github.com/genomehubs/genomehubs
```

Initialise a new GenomeHub with all INSDC Lepidoptera assemblies:
```
conda activate ghubs_env
cd genomehubs
./genomehubs init --taxonomy-root 7088 --insdc
```

Index GFF files:
```
./genomehubs index --taxonomy-root 7088 \
                   --gff3 tests/files/gff3/ASM31383v2.gff \
                   --gff3 tests/files/gff3/Bicyclus_anynana_v1.2.gff \
                   --gff3 tests/files/gff3/GCA_000235995.2.gff \
                   --gff3 tests/files/gff3/MelCinx1.0.gff
```
