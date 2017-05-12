## Create a MySQL data directory

{% method %}
Create a `mysql/data` directory to allow the databases to be stored outside of the MySQL container:

{% common %}
```bash
$ mkdir -p mysql/data
```
{% endmethod %}


## Create a MySQL container

{% method %}
Create a MySQL Docker container to host the Ensembl Databases for your GenomeHub:

{% common %}
```bash
$ docker run -d \
           --name genomehubs-mysql \
           -v /volumes/mysql/data:/var/lib/mysql \
           -e MYSQL_ROOT_PASSWORD=changethispassword \
           -e MYSQL_ROOT_HOST='172.17.0.0/255.255.0.0' \
           -p 3306:3306 \
           mysql/mysql-server:5.5
```
{% endmethod %}

{% method %}
Log in to mysql inside the container to increase `max_allowed_packet` to allow import of large scaffolds:

{% common %}
```bash
$ docker exec -it genomehubs-mysql bash
# mysql -u root -p
> set global max_allowed_packet=100000000;
```
{% endmethod %}

