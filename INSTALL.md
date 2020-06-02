
[Install docker](https://docs.docker.com/get-docker/)

Install remaining dependencies using conda
```
conda create -n ghubs_env -c conda-forge -y defusedxml docker-py docopt elasticsearch ete3 python=3.8 pyyaml tqdm ujson

conda activate ghubs_env
```

Git clone the prerelease/v2.0 from the GenomeHubs repo
```
git clone -b prerelease/v2.0 https://github.com/genomehubs/genomehubs
```
