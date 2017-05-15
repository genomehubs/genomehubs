# Start BLAST server

{% method %}
A SequenceServer BLAST server container provides a user friendly BLAST interface to genomes hosted in a GenomeHub.

{% common %}
![](/assets/GenomeHubs BLAST.png)
{% endmethod %}


## Edit files in conf directory

{% method %}
Edit Masthead.html to change the site name, logos and link urls:

{% common %}
```
$ 
```

{% endmethod %}



## Start SequenceServer BLAST container

{% method %}
Start the SequenceServer Docker container:

{% common %}
```
$ docker run -d \
             --name genomehubs-sequenceserver \
             -v ~/genomehubs/v1/blast/conf:/conf:ro \
             -v ~/genomehubs/v1/blast/data:/dbs:ro \
             -p 8083:4567 \
             genomehubs/sequenceserver:latest
```

{% endmethod %}


