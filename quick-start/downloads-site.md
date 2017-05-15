# Start downloads server

{% method %}
GenomeHubs provides an h5ai container to host files for download. Any files in directories mounted in the container under `/var/www` will be available for download so additional files can be hosted alongside the files generated in previous steps.

{% common %}
![](/assets/GenomeHubs downloads.png)
{% endmethod %}


## Edit files in conf directory

{% method %}
Edit Masthead.html to change the site name, logos and link urls:

{% common %}
```
$ 
```

{% endmethod %}



## Start h5ai downloads container

{% method %}
Start the h5ai Docker container:

{% common %}
```
$ docker run -d \
             --name genomehubs-h5ai \
             -v ~/genomehubs/v1/download/conf:/conf:ro \
             -v ~/genomehubs/v1/download/data:/var/www/v1:ro \
             -p 8082:8080 \
             genomehubs/h5ai:latest
```

{% endmethod %}


