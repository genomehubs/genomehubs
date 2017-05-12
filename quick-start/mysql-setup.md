# MySQL setup

Each assembly in an Ensembl site is stored in a separate MySQL database. GenomeHubs sites host these databases in a MySQL Docker container.


## Create a MySQL container

{% method %}
Create a `mysql/data` directory to allow the databases to be stored outside of the MySQL container:

{% common %}
```bash
$ mkdir -p ~/genomehubs/mysql/data
```

{% endmethod %}


{% method %}
Create a MySQL Docker container to host the Ensembl Databases for your GenomeHub:

* See [hub.docker.com](https://hub.docker.com/r/mysql/mysql-server/) for more information on the MySQL Docker image.

{% common %}
```bash
$ docker run -d \
           --name genomehubs-mysql \
           -v ~/genomehubs/mysql/data:/var/lib/mysql \
           -e MYSQL_ROOT_PASSWORD=changethispassword \
           -e MYSQL_ROOT_HOST='172.17.0.0/255.255.0.0' \
           -p 3306:3306 \
           mysql/mysql-server:5.5
```
{% endmethod %}

{% method %}
Log in to MySQL inside the container to increase `max_allowed_packet` to allow import of large scaffolds:

{% common %}
```bash
$ docker exec -it genomehubs-mysql bash
# mysql -u root -p
> set global max_allowed_packet=100000000;
```
{% endmethod %}


## Import Ensembl databases

{% method %}
Edit the `database.ini` configuration file to set passwords for the database users:

* the root user password should match the value of `MYSQL_ROOT_PASSWORD` in the `docker run` command above
* to mirror existing Ensembl databases in your GenomeHub, add the appropriate database names to `SPECIES_DBS` as a space-separated list (a corresponding database dump must be available at `SPECIES_DB_URL`)
* even if you do not wish to mirror any existing databases, at least one database must be specified in `SPECIES_DBS` for use as a template when importing new data.

{% common %}
```bash
$ nano ~/genomehubs/v1/ensembl/data
```
{% endmethod %}



