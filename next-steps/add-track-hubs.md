# Add track hubs

Track hubs allow for the display of tracks of data alongside the other data in the Ensembl genome browser. This is a very flexible feature and the data can be hosted anywhere.

The following is an annotated example of an RNA-seq alignment track hub on the _Heliconius melpomene melpomene Hmel2_ assembly available on [ensembl.lepbase.org](http://ensembl.lepbase.org/Heliconius_melpomene_melpomene_hmel2/Location/View?db=core;r=Hmel217020:480802-490685), which you can adapt to suit your data. _Trackhubs are not visible by default but can be displayed by using the cog symbol to configure lowest of the region views on the linked page._

## Set up the track hub

Add the track data to a publicly accessible location:

* here the data are added to a directory hosted at [download.lepbase.org/v4/trackhub/data/rnaseq/heliconius\_melpomene\_melpomene\_hmel2/](http://download.lepbase.org/v4/trackhub/data/rnaseq/heliconius_melpomene_melpomene_hmel2/)

```text
$ ls -sh /path/to/trackhub/data/rnaseq/heliconius_melpomene_melpomene_hmel2/
total 2.3G
 98M 13F.bw  103M 15A.bw  101M ERR232445.bw   81M ERR232460.bw
111M 13G.bw  104M 15B.bw   81M ERR232447.bw  163M SRR2076766.bw
105M 13H.bw  104M 15C.bw   75M ERR232451.bw  129M SRR2076767.bw
110M 13I.bw   96M 15D.bw  108M ERR232456.bw  211M SRR2076768.bw
105M 13J.bw  111M 15E.bw  100M ERR232458.bw  212M SRR2076769.bw
```

Create a hub.txt file with a description of the data available in the track hub:

```text
$ nano /path/to/trackhub/rnaseq/hub.txt
hub LepBase-RNASeq
shortLabel RNA-Seq Alignments
longLabel RNA-Seq Alignments for LepBase
genomesFile genomes.txt
email help@lepbase.org
```

Create a genomes.txt file with a 2 line entry for each assembly linking the assembly name to the associated track configuration files:

```text
$ nano /path/to/trackhub/rnaseq/genomes.txt
genome Hmel2
trackDb Hmel2/trackDb.txt
```

Create a trackDb.txt file for your assembly:

* the first section creates a superTrack to group all datasets
* the following sections define three compositeTracks, one for each of the datasets included in the track hub
* the remaining sections each specify the path to one of the bigwig files hosted on [download.lepbase.org](http://download.lepbase.org) and the compositeTrack to which the sample belongs

```text
$ nano /path/to/trackhub/rnaseq/Hmel2/trackDb.txt
track RNASeq
superTrack on
group RNASeq
shortLabel RNASeq
longLabel Heliconius melpomene melpomene tissues
html doc/RNASeq

track WingRNASeq
compositeTrack on
group WingRNASeq
shortLabel Wing RNA-Seq
longLabel Heliconius melpomene melpomene wing tissues
html doc/WingRNASeq

track PRJEB1499
compositeTrack on
group PRJEB1499
shortLabel PRJEB1499
longLabel RNA-seq of adult Heliconius melpomene rosina male and female chemosensory tissues: antennae, labial palps and proboscis, and legs
html doc/PRJEB1499

track PRJNA283415
compositeTrack on
group PRJNA283415
shortLabel PRJNA283415
longLabel Sex-specific transcriptomes of adult head and abdomen from 3 species of Heliconius butterfly
html doc/PRJNA283415

track ERR232445
parent PRJEB1499
type bigWig
bigDataUrl http://download.lepbase.org/v4/trackhub/data/rnaseq/heliconius_melpomene_melpomene_hmel2/ERR232445.bw
shortLabel ERR232445
longLabel Hmel_503_F_labial_palps_proboscis
color 204,0,0
html docs/ERR232445
visibility full

...

track SRR2076766
parent PRJNA283415
type bigWig
bigDataUrl http://download.lepbase.org/v4/trackhub/data/rnaseq/heliconius_melpomene_melpomene_hmel2/SRR2076766.bw
shortLabel SRR2076766
longLabel R29_F_mel_ab
color 204,0,0
html docs/SRR2076766
visibility full

...

track 13F
parent WingRNASeq
type bigWig
bigDataUrl http://download.lepbase.org/v4/trackhub/data/rnaseq/heliconius_melpomene_melpomene_hmel2/13F.bw
shortLabel 13F
longLabel 13F
color 204,0,0
html docs/13F
visibility full

...
```

For each sample, add an html file with a brief description to a `docs` folder:

* this will be displayed if a user clicks the information icon while configuring the display in the Ensembl browser to show/hide tracks

```text
$ nano /path/to/trackhub/rnaseq/Hmel2/docs/ERR232445.html
Heliconius melpomene transcriptome sample Hmel_503_F_labial_palps_proboscis (SRA accession: <a href="https://www.ncbi.nlm.nih.gov/sra/?term=ERR232445">ERR232445</a>)
```

## Add the track hub to your Ensembl browser

Add/edit an assembl-specific configuration file in your Ensembl plugin:

* update the `url` to point to your own site
* remember to commit and push the changes when done

```text
$ nano conf/ini-files/Heliconius_melpomene_melpomene_hmel2.ini
[ENSEMBL_INTERNAL_TRACKHUB_SOURCES]
RNASEQ = genomehubs_rnaseq

[RNASEQ]
source_name = genomehubs_rnaseq
url = http://download.lepbase.org/v4/trackhub/rnaseq/hub.txt
```

Restart your Ensembl site to add the track hub:

* adding the trackhub to an assembly requires a restart, but subsequent changes to the data/configuration files will be picked up automatically

{% tabs %}
{% tab title="e85" %}
```text
$ docker rm -f genomehubs-ensembl
$ docker run -d \
             --name genomehubs-ensembl \
             -v ~/genomehubs/v1/ensembl/conf:/ensembl/conf:ro \
             --link genomehubs-mysql \
             -p 8081:8080 \
             genomehubs/easy-mirror:17.03
```
{% endtab %}

{% tab title="e89" %}
```text
$ docker rm -f genomehubs-ensembl
$ docker run -d \
             --name genomehubs-ensembl \
             -v ~/genomehubs/v1/ensembl/conf:/conf:ro \
             --link genomehubs-mysql \
             -p 8081:8080 \
             genomehubs/easy-mirror:17.06
```
{% endtab %}
{% endtabs %}

