# Start Ensembl genome browser

{% method %}
Ensembl genome browser.

{% common %}
![](/assets/GenomeHubs Ensembl.png)
{% endmethod %}


## Edit files in conf directory

{% method %}
Edit setup.ini to change the passwords and database names:

{% common %}
```
$ 
```

{% endmethod %}


## Write a plugin to configure the Ensembl site

{% method %}
Fork the genomehubs/example-plugin repository:

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


