#Connect using the Perl API

{% method %}
The EasyImport container can be used to run [Ensembl API](http://www.ensembl.org/info/docs/api/index.html) scripts to query databases programmatically. To do this, mount a directory containing your API script onto an EasyImport container and run the script by passing a perl command after the container image name:

Create a hub.txt file with a description of the data available in the track hub:

{% sample lang="e85" %}
```
$ docker run --rm \
             -u $UID:$GROUPS \
             --name perl-api-exampl \
             --link genomehubs-mysql \
             -v /pat/to/api/srcipt/dir:/import/api/scripts \
             genomehubs/easy-import:17.03 \
             perl /import/api/scripts/example-api-script.pl

```

{% sample lang="e89" %}
```
$ docker run --rm \
             -u $UID:$GROUPS \
             --name perl-api-exampl \
             --link genomehubs-mysql \
             -v /pat/to/api/srcipt/dir:/import/api/scripts \
             genomehubs/easy-import:17.06 \
             perl /import/api/scripts/example-api-script.pl

```

{% endmethod %}
