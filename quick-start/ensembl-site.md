# Start Ensembl genome browser

{% method %}
Ensembl genome browser.

{% common %}
![](/assets/GenomeHubs Ensembl.png)
{% endmethod %}


## Edit `setup.ini`

{% method %}
Set passwords:

{% common %}
```
$ 
```

{% endmethod %}


{% method %}
Add details of your Ensembl plugin:

{% common %}
```
$ 
```

{% endmethod %}


{% method %}
Set database names to load:

{% common %}
```
$ 
```

{% endmethod %}



## Start the EasyMirror container

{% method %}
Start the EasyMirror Docker container:

{% common %}
```
$ docker run -d \
             --name genomehubs-ensembl \
             -v ~/genomehubs/v1/ensembl/conf:/ensembl/conf:ro \
             --link genomehubs-mysql \
             -p 8081:8080 \
             genomehubs/easy-mirror:latest
```

{% endmethod %}


