# Start search container

{% method %}
Starting with version 19.05 which runs Ensembl release 93, it is necessary to start an additional container to run searches against the Ensembl database.

We anticipate adding functionality to search across additional GenomeHubs resources in future releases.

{% sample lang="e93" %}
```
$ docker run -d \
             --name genomehubs-search \
             -v ~/genomehubs/v1/ensembl/conf:/conf:ro \
             --network genomehubs-network \
             -p 8884:8080 \
             genomehubs/search:19.05
```
