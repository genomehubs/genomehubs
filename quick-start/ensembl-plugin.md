# Write Ensembl plugin

{% method %}
Ensembl sites use a plugin architecture that allows any methods/settings to be overwritten by files that are loaded after the main webcode. GenomeHubs provides a plugin which customises some of the features of a standard Ensembl Site, however, in order to set links to the other site components (particlarly the downloads server which hosts data for the assembly statistic visualisations) it is necessary to write a plugin.

At its simplest, this plugin need only contain a configuration file to specify URLs, but it is also useful to include images and text for the assemblies that you will be hosting. Beyond this a plugin could be developed to customise almost any feature of the site so this provides an introduction to one of the most powerful features of an Ensembl site.

{% common %}
![](/assets/GenomeHubs Ensembl.png)
{% endmethod %}


## Create a plugin

Visit github and fork the [genomehubs/template-plugin]() into your own github account.
* 

{% method %}
Edit `DEFAULT.ini` to update urls:

{% common %}
```
$ 
```

{% endmethod %}




