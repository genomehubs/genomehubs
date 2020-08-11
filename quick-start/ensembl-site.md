# 12. Start Ensembl browser

Ensembl genome browser.

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

Add details of your Ensembl plugin:

* update `YOUR_PLUGIN_URL` to point to the git repository you created in  the previous step
* these details should be added above the `GENOMEHUBS_PLUGIN_URL` so files in this plugin will overwrite those in the GenomeHubs plugin

{% tabs %}
{% tab title="e93" %}
```text
$ nano ~/genomehubs/v1/ensembl/conf/setup.ini
[REPOSITORIES]
  ENSEMBL_URL = https://github.com/Ensembl
  ENSEMBL_BRANCH = release/93

  BIOPERL_URL = https://github.com/bioperl
  BIOPERL_BRANCH = master

  API_PLUGIN_URL = https://github.com/EnsemblGenomes/ensemblgenomes-api
  API_PLUGIN_BRANCH = release/eg/93
  API_PLUGIN_PACKAGE = EG::API

  YOUR_PLUGIN_URL = https://github.com/YOURACCOUNT/YOUR-PLUGIN-NAME
  YOUR_PLUGIN_BRANCH = master
  YOUR_PLUGIN_PACKAGE = EG::YourPlugin

  GENOMEHUBS_PLUGIN_URL = https://github.com/genomehubs/gh-ensembl-plugin
  GENOMEHUBS_PLUGIN_BRANCH = 18.10
  GENOMEHUBS_PLUGIN_PACKAGE = EG::GenomeHubs

  EG_COMMON_PLUGIN_URL = https://github.com/EnsemblGenomes/eg-web-common
  EG_COMMON_PLUGIN_BRANCH = release/eg/40
  EG_COMMON_PLUGIN_PACKAGE = EG::Common

  PUBLIC_PLUGINS = [ ]
```
{% endtab %}

{% tab title="e89" %}
```text
$ nano ~/genomehubs/v1/ensembl/conf/setup.ini
[REPOSITORIES]
  ENSEMBL_URL = https://github.com/Ensembl
  ENSEMBL_BRANCH = release/89

  BIOPERL_URL = https://github.com/bioperl
  BIOPERL_BRANCH = master

  API_PLUGIN_URL = https://github.com/EnsemblGenomes/ensemblgenomes-api
  API_PLUGIN_BRANCH = release/eg/36
  API_PLUGIN_PACKAGE = EG::API

  YOUR_PLUGIN_URL = https://github.com/YOURACCOUNT/YOUR-PLUGIN-NAME
  YOUR_PLUGIN_BRANCH = master
  YOUR_PLUGIN_PACKAGE = EG::YourPlugin

  GENOMEHUBS_PLUGIN_URL = https://github.com/genomehubs/gh-ensembl-plugin
  GENOMEHUBS_PLUGIN_BRANCH = 17.06
  GENOMEHUBS_PLUGIN_PACKAGE = EG::GenomeHubs

  EG_COMMON_PLUGIN_URL = https://github.com/EnsemblGenomes/eg-web-common
  EG_COMMON_PLUGIN_BRANCH = release/eg/36
  EG_COMMON_PLUGIN_PACKAGE = EG::Common

  PUBLIC_PLUGINS = [ ]
```
{% endtab %}

{% tab title="e85" %}
```text
$ nano ~/genomehubs/v1/ensembl/conf/setup.ini
[REPOSITORIES]
  ENSEMBL_URL = https://github.com/Ensembl
  ENSEMBL_BRANCH = release/85

  BIOPERL_URL = https://github.com/bioperl
  BIOPERL_BRANCH = master

  API_PLUGIN_URL = https://github.com/EnsemblGenomes/ensemblgenomes-api
  API_PLUGIN_BRANCH = release/eg/32
  API_PLUGIN_PACKAGE = EG::API

  YOUR_PLUGIN_URL = https://github.com/YOURACCOUNT/YOUR-PLUGIN-NAME
  YOUR_PLUGIN_BRANCH = master
  YOUR_PLUGIN_PACKAGE = EG::YourPlugin

  GENOMEHUBS_PLUGIN_URL = https://github.com/genomehubs/gh-ensembl-plugin
  GENOMEHUBS_PLUGIN_BRANCH = 17.03
  GENOMEHUBS_PLUGIN_PACKAGE = EG::GenomeHubs

  EG_COMMON_PLUGIN_URL = https://github.com/EnsemblGenomes/eg-web-common
  EG_COMMON_PLUGIN_BRANCH = release/eg/32
  EG_COMMON_PLUGIN_PACKAGE = EG::Common

  PUBLIC_PLUGINS = [ ]
```
{% endtab %}
{% endtabs %}

Set database names to load:

* Assemblies will be listed on your Ensembl site homepage in the order they are added to `SPECIES_DBS`

{% tabs %}
{% tab title="e93" %}
```text
$ nano ~/genomehubs/v1/ensembl/conf/setup.ini
[DATA_SOURCE]
  SPECIES_DBS = [ 
    mellitaea_cinxia_core_40_93_1
    operophtera_brumata_obru1_core_40_93_1
]
```
{% endtab %}

{% tab title="e89" %}
```text
$ nano ~/genomehubs/v1/ensembl/conf/setup.ini
[DATA_SOURCE]
  SPECIES_DBS = [ 
    mellitaea_cinxia_core_36_89_1
    operophtera_brumata_obru1_core_36_89_1
]
```
{% endtab %}

{% tab title="e85" %}
```text
$ nano ~/genomehubs/v1/ensembl/conf/setup.ini
[DATA_SOURCE]
  SPECIES_DBS = [ 
    mellitaea_cinxia_core_32_85_1
    operophtera_brumata_obru1_core_32_85_1
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

