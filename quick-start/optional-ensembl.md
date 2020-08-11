# \(optional\) Test Ensembl browser

At this stage you may wish to start up a basic Ensembl mirror site using the local copy of the Ensembl core database\(s\) from the previous step. This will lack many of the additional features of a complete GenomeHubs site but provides a useful opportunity to check that the basic components are working before continuing with the instructions to import your own data.

![](../.gitbook/assets/GenomeHubs%20Ensembl.png)

## Edit `setup.ini`

Edit database settings:

* for the default setup, only `DB_SESSION_PASS` should need changing
* database hosts should match the name of your mysql container
* `DB_FALLBACK_HOST` is used to allow additional databases to be loaded from a remote host \(in this case EnsemblGenomes\) so not all databases need to be hosted locally

```text
$ nano ~/genomehubs/v1/ensembl/conf/setup.ini
[DATABASE]
  DB_HOST = genomehubs-mysql
  DB_PORT = 3306
  DB_USER = anonymous
  DB_PASS =

  DB_FALLBACK_HOST = mysql-eg-publicsql.ebi.ac.uk
  DB_FALLBACK_PORT = 4157
  DB_FALLBACK_USER = anonymous
  DB_FALLBACK_PASS =

  DB_SESSION_HOST = genomehubs-mysql
  DB_SESSION_PORT = 3306
  DB_SESSION_USER = ensrw
  DB_SESSION_PASS = CHANGEME
```

Set database names to load:

* Assemblies will be listed on your Ensembl site homepage in the order they are added to `SPECIES_DBS`

{% tabs %}
{% tab title="e93" %}
```text
$ nano ~/genomehubs/v1/ensembl/conf/setup.ini
[DATA_SOURCE]
  SPECIES_DBS = [ 
    melitaea_cinxia_core_40_93_1
]
```
{% endtab %}

{% tab title="e89" %}
```text
$ nano ~/genomehubs/v1/ensembl/conf/setup.ini
[DATA_SOURCE]
  SPECIES_DBS = [ 
    melitaea_cinxia_core_36_89_1
]
```
{% endtab %}

{% tab title="e85" %}
```text
$ nano ~/genomehubs/v1/ensembl/conf/setup.ini
[DATA_SOURCE]
  SPECIES_DBS = [ 
    melitaea_cinxia_core_32_85_1
]
```
{% endtab %}
{% endtabs %}

## Start the EasyMirror container

Start the EasyMirror Docker container:

{% tabs %}
{% tab title="e93" %}
```text
$ docker run -d \
             --name genomehubs-ensembl \
             -v ~/genomehubs/v1/ensembl/conf:/conf:ro \
             --network genomehubs-network \
             -p 8881:8080 \
             genomehubs/easy-mirror:19.05
```
{% endtab %}

{% tab title="e89" %}
```text
$ docker run -d \
             --name genomehubs-ensembl \
             -v ~/genomehubs/v1/ensembl/conf:/conf:ro \
             --link genomehubs-mysql \
             -p 8081:8080 \
             genomehubs/easy-mirror:17.06
```
{% endtab %}

{% tab title="e85" %}
```text
$ docker run -d \
             --name genomehubs-ensembl \
             -v ~/genomehubs/v1/ensembl/conf:/ensembl/conf:ro \
             --link genomehubs-mysql \
             -p 8081:8080 \
             genomehubs/easy-mirror:17.03
```
{% endtab %}
{% endtabs %}

