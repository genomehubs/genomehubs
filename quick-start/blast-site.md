# Start BLAST server

{% method %}
A SequenceServer BLAST server container provides a user friendly BLAST interface to genomes hosted in a GenomeHub.

{% common %}
![](/assets/GenomeHubs BLAST.png)
{% endmethod %}


## Edit files in conf directory

{% method %}
Edit `Masthead.html` to change the site name, logos and link urls:
* add images to the `~/genomehubs/v1/blast/conf/img` directory if you wish to include them on your site
* further changes to the appearance can be made by editing the styles in `custom.css`

{% common %}
```
$ cd ~/genomehubs/v1/blast/conf
# if you have a google analytics code to track usage
$ sed 's/UA-00000000-0/your analytics code/' Masthead.html
$ nano Masthead.html
# replace references to example.com with your domain name
```
{% endmethod %}

{% method %}
Edit `links.rb` to ensure that links from BLAST results are directed to your Ensembl site:
* keys in `taxa` should match your database name(s), values should match the corresponding `SPECIES.URL`
* modify the `url = "http://ensembl.genomehubs.org/#{assembly}"` to match your domain name

{% sample lang="e85" %}
```
$ nano links.rb
...
    def genomehubs
      taxa = {}
      taxa["operophtera_brumata_obru1_core_32_85_1"] = "Operophtera_brumata_Obru1"
...
      accession = encode accession
      colon = ':'
      url = "http://ensembl.genomehubs.org/#{assembly}"
...

```
{% sample lang="e89" %}
```
$ nano links.rb
...
    def genomehubs
      taxa = {}
      taxa["operophtera_brumata_obru1_core_36_89_1"] = "Operophtera_brumata_Obru1"
...
      accession = encode accession
      colon = ':'
      url = "http://ensembl.genomehubs.org/#{assembly}"
...

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


