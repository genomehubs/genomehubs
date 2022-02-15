Use Conda to install dependencies

```
conda create -n ghubs_web_env -c conda-forge -y nodejs=14

conda activate ghubs_web_env

```

Git clone the develop branch from the GenomeHubs repo

```
git clone -b develop https://github.com/genomehubs/genomehubs-ui
```

Install the Node modules (must be run with the `ghubs_web_env` activated)

```
cd genomehubs-ui
npm install
```

Start GenomeHubs UI at http://localhost:8880

```
npm run client
```
