
Use Conda to install dependencies
```
conda create -n ghubs_web_env -c conda-forge -y nodejs=14

conda activate ghubs_web_env

```

Git clone the prerelease/v2.0 from the GenomeHubs repo
```
git clone -b prerelease/v2.0 https://github.com/genomehubs/genomehubs
```

Install the Node modules (must be run with the `ghubs_web_env` activated)
```
cd genomehubs/web
npm install
```

Start GenomeHubs web at http://localhost:8880
```
npm run client
```
