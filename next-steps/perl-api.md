#Connect using the Perl API

The EasyImport container can be used to run [Ensembl API](http://www.ensembl.org/info/docs/api/index.html) scripts to query databases programmatically. To do this, mount a directory containing your API script onto an EasyImport container and run the script by passing a perl command after the container image name:

```
$ docker run --rm \
             -u $UID:$GROUPS \
             --name perl-api-exampl \
             --link genomehubs-mysql \
             -v /pat/to/api/srcipt/dir:/import/api/scripts \
             genomehubs/easy-import:latest \
             perl /import/api/scripts/example-api-script.pl

```