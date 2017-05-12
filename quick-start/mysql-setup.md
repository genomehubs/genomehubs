# MySQL setup

Each assembly in an Ensembl site is stored in a separate MySQL database. GenomeHubs sites host these databases in a MySQL Docker container.

{% method %}
### Create a MySQL data directory

Create a `mysql/data` directory to allow the databases to be stored outside of the MySQL container:

{% common %}
```bash
$ mkdir -p ~/genomehubs/mysql/data
```
{% endmethod %}



{% method %}
### Create a MySQL container

Create a MySQL Docker container to host the Ensembl Databases for your GenomeHub:

See [hub.docker.com](https://hub.docker.com/r/mysql/mysql-server/) for more information on the MySQL Docker image.

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


{% method %}
### Import Ensembl databases

Create a `mysql/data` directory to allow the databases to be stored outside of the MySQL container:

{% common %}
```bash
$ mkdir -p ~/genomehubs/mysql/data
```
{% endmethod %}



