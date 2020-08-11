# 9. Start BLAST server

A SequenceServer BLAST server container provides a user friendly BLAST interface to genomes hosted in a GenomeHub.

![](../.gitbook/assets/GenomeHubs%20BLAST.png)

## Edit files in conf directory

Edit `Masthead.html` to change the site name, logos and link urls:

* add images to the `~/genomehubs/v1/blast/conf/img` directory if you wish to include them on your site
* further changes to the appearance can be made by editing the styles in `custom.css`

```text
$ cd ~/genomehubs/v1/blast/conf
# if you have a google analytics code to track usage
$ sed 's/UA-00000000-0/your analytics code/' Masthead.html
$ nano Masthead.html
# replace references to example.com with your domain name
```

Edit `links.rb` to ensure that links from BLAST results are directed to your Ensembl site:

* modify the `url = "http://localhost:8881/#{assembly}"` to match your domain name

{% tabs %}
{% tab title="e93" %}
```text
$ nano links.rb
...
    def genomehubs
...
      url = "http://localhost:8881/#{assembly}"
...
```
{% endtab %}

{% tab title="e89" %}
```text
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
{% endtab %}

{% tab title="e85" %}
```text
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
{% endtab %}
{% endtabs %}

## Start SequenceServer BLAST container

Start the SequenceServer Docker container:

```text
$ docker run -d \
             --name genomehubs-sequenceserver \
             --network genomehubs-network \
             -v ~/genomehubs/v1/blast/conf:/conf:ro \
             -v ~/genomehubs/v1/blast/data:/dbs \
             -p 8883:4567 \
             genomehubs/sequenceserver:19.05
```

