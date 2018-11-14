# Setup MySQL database server

{% method %}
Each assembly in an Ensembl site is stored in a separate MySQL database. GenomeHubs sites host these databases in a MySQL Docker container. 

The EasyMirror container is used to configure users and password in the MySQL container and to mirror Ensembl databases from SQL dumps on the [Ensembl](ftp://ftp.ensembl.org/pub)/[EnsemblGenomes](ftp://ftp.ensemblgenomes.org/pub) ftp sites, making local copies ready to be hosted alongside newly imported data in a GenomeHubs site.

{% common %}
#![](/assets/GenomeHubs MySQL.png) 
{% endmethod %}


## Create a MySQL container

{% method %}
Create a `mysql/data` directory to allow the databases to be stored outside of the MySQL container:

{% common %}
```
$ mkdir -p ~/genomehubs/mysql/data
```

{% endmethod %}


{% method %}
Create a MySQL Docker container to host the Ensembl Databases for your GenomeHub:

* See [hub.docker.com](https://hub.docker.com/r/mysql/mysql-server/) for more information on the MySQL Docker image.
* Docker sets up its own network so setting `MYSQL_ROOT_HOST='172.17.0.0/255.255.0.0'` will allow other Docker containers on the same machine to connect 

{% common %}
```
$ docker run -d \
             --name genomehubs-mysql \
             --network genomehubs-network \
             -v ~/genomehubs/mysql/data:/var/lib/mysql \
             -e MYSQL_ROOT_PASSWORD=CHANGEME \
             -e MYSQL_ROOT_HOST='172.17.0.0/255.255.0.0' \
             -p 3306:3306 \
             mysql/mysql-server:5.5
```
{% endmethod %}

{% method %}
Log in to MySQL inside the container to increase `max_allowed_packet` to allow import of large scaffolds:

{% common %}
```
$ docker exec -it genomehubs-mysql bash
# mysql -u root -p
> set global max_allowed_packet=10000000000;
> exit
```
{% endmethod %}


## Import Ensembl databases

{% method %}
Edit the `database.ini` configuration file to set passwords for the database users:

* the `DB_ROOT_PASSWORD` should match the value of `MYSQL_ROOT_PASSWORD` in the `docker run` command above
* the `DB_HOST` must match the value of `--name` in the `docker run` command above
* to mirror existing Ensembl databases in your GenomeHub, add the appropriate database names to `SPECIES_DBS` as a space-separated list (a corresponding database dump must be available at `SPECIES_DB_URL`)
* even if you do not wish to mirror any existing databases, at least one database must be specified in `SPECIES_DBS` for use as a template when importing new data.

{% sample lang="e93" %}
```
$ nano ~/genomehubs/v1/ensembl/conf/database.ini
# (some lines omitted)
[DATABASE]
  DB_SESSION_USER = ensrw
  DB_SESSION_PASS = CHANGEME

  DB_IMPORT_USER = importer
  DB_IMPORT_PASSWORD = CHANGEME

  DB_ROOT_USER = root
  DB_ROOT_PASSWORD = CHANGEME
  DB_PORT = 3306
  DB_HOST = genomehubs-mysql

[DATA_SOURCE]
  SPECIES_DB_URL = ftp://ftp.ensemblgenomes.org/pub/release-40/metazoa/mysql/
  SPECIES_DBS = [ melitaea_cinxia_core_40_93_1 ]

  MISC_DB_URL = ftp://ftp.ensembl.org/pub/release-93/mysql/
  MISC_DBS = [ ensembl_accounts ]
```

{% sample lang="e89" %}
```
$ nano ~/genomehubs/v1/ensembl/conf/database.ini
# (some lines omitted)
[DATABASE]
  DB_SESSION_USER = ensrw
  DB_SESSION_PASS = CHANGEME

  DB_IMPORT_USER = importer
  DB_IMPORT_PASSWORD = CHANGEME

  DB_ROOT_USER = root
  DB_ROOT_PASSWORD = CHANGEME
  DB_PORT = 3306
  DB_HOST = genomehubs-mysql

[DATA_SOURCE]
  SPECIES_DB_URL = ftp://ftp.ensemblgenomes.org/pub/release-36/metazoa/mysql/
  SPECIES_DBS = [ melitaea_cinxia_core_36_89_1 ]
  
  MISC_DB_URL = ftp://ftp.ensembl.org/pub/release-89/mysql/
  MISC_DBS = [ ensembl_accounts ]
```
{% sample lang="e85" %}
```
$ nano ~/genomehubs/v1/ensembl/conf/database.ini
# (some lines omitted)
[DATABASE]
  DB_SESSION_USER = ensrw
  DB_SESSION_PASS = CHANGEME

  DB_IMPORT_USER = importer
  DB_IMPORT_PASSWORD = CHANGEME

  DB_ROOT_USER = root
  DB_ROOT_PASSWORD = CHANGEME
  DB_PORT = 3306
  DB_HOST = genomehubs-mysql

[DATA_SOURCE]
  SPECIES_DB_URL = ftp://ftp.ensemblgenomes.org/pub/release-32/metazoa/mysql/
  SPECIES_DBS = [ melitaea_cinxia_core_32_85_1 ]

  MISC_DB_URL = ftp://ftp.ensembl.org/pub/release-79/mysql/
  MISC_DBS = [ ensembl_accounts ]
```

{% endmethod %}


{% method %}
Run the `database.sh` script in a `genomehubs/easy-mirror` Docker container:

* this script will set up database users and import databases into your MySQL container based on the information in the `database.ini` configuration file.

{% sample lang="e93" %}
```
$ docker run --rm \
             --name genomehubs-ensembl \
             --network genomehubs-network \
             -v ~/genomehubs/v1/ensembl/conf:/ensembl/conf:ro \
             genomehubs/easy-mirror:18.10 /ensembl/scripts/database.sh /ensembl/conf/database.ini
```

{% sample lang="e89" %}
```
$ docker run --rm \
             --name genomehubs-ensembl \
             -v ~/genomehubs/v1/ensembl/conf:/ensembl/conf:ro \
             --link genomehubs-mysql \
             genomehubs/easy-mirror:17.06 /ensembl/scripts/database.sh /ensembl/conf/database.ini
```

{% sample lang="e85" %}
```
$ docker run --rm \
             --name genomehubs-ensembl \
             -v ~/genomehubs/v1/ensembl/conf:/ensembl/conf:ro \
             --link genomehubs-mysql \
             genomehubs/easy-mirror:17.03 /ensembl/scripts/database.sh /ensembl/conf/database.ini
```

{% endmethod %}


