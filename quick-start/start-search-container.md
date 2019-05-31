# Start search container

{% method %}
Starting with version 19.05 which runs Ensembl release 93, it is necessary to start an additional container to run searches against the Ensembl database.

This container must be named `genomehubs-search` and be made available on the same docker network as the `genomehubs-ensembl` container for the search configuration to work.

We anticipate adding functionality to search across additional GenomeHubs resources in future releases.

{% sample lang="e93" %}
```
$ docker run -d \
             --name genomehubs-search \
             --network genomehubs-network \
             -p 8884:8080 \
             genomehubs/search:19.05
```

Optionally add a custom apache configuration file to override defaults

```
mkdir -p ~/genomehubs/v1/search/conf
nano ~/genomehubs/v1/search/conf/search.genomehubs.org.conf
```

~/genomehubs/v1/search/conf/search.genomehubs.org.conf:
```
Listen 8080

<VirtualHost *:8080>

    RewriteEngine  on
    RewriteRule    "^/lbsearch$"  "/cgi-bin/lbsearch" [PT]
    RewriteRule    "^/autocomplete$"  "/cgi-bin/autocomplete" [PT]

    ServerAdmin webmaster@search.genomehubs.org
    ServerName search.genomehubs.org
    ServerAlias search.genomehubs.org
    DocumentRoot /var/www/search.genomehubs.org/httpdocs
    ErrorLog /var/www/search.genomehubs.org/logs/error.log 
    CustomLog /var/www/search.genomehubs.org/logs/access.log combined
    ScriptAlias "/cgi-bin/" "/var/www/search.genomehubs.org/cgi-bin/"
    <Directory "/var/www/search.genomehubs.org/cgi-bin/">
        Options +ExecCGI
        SetHandler cgi-script
    </Directory>    
</VirtualHost>

```

```
$ docker run -d \
             --name genomehubs-search \
             -v ~/genomehubs/v1/search/conf:/conf:ro \
             --network genomehubs-network \
             -p 8884:8080 \
             genomehubs/search:19.05
```

