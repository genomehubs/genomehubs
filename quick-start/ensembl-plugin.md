# Edit Ensembl plugin

{% method %}
Ensembl sites use a plugin architecture that allows any methods/settings to be overwritten by files that are loaded after the main webcode. GenomeHubs provides a plugin which customises some of the features of a standard Ensembl Site, however, in order to set links to the other site components (particlarly the downloads server which hosts data for the assembly statistic visualisations) it is necessary to write a plugin.

At its simplest, this plugin need only contain a configuration file to specify URLs, but it is also useful to include images and text for the assemblies that you will be hosting. Beyond this a plugin could be developed to customise almost any feature of the site so this provides an introduction to one of the most powerful features of an Ensembl site.

{% common %}
![](/assets/GenomeHubs Ensembl.png)
{% endmethod %}


## Create a plugin

Visit github and fork the [genomehubs/template-plugin](https://github.com/genomehubs/template-plugin) into your own github account.
* GenomeHubs fetches plugins from git repositories when starting the Ensembl browser so your plugin must be available in a git repository, but this does not need to be a publicly hosted repository on Github so long as it is accessible via `git clone` from the machine that will host the Ensembl site. 

{% method %}
Edit `conf/ini-files/DEFAULTS.ini` to update urls, logos and styles:
* modify entries that refer to genomehubs
* ensure that urls point to your domain
* ensure that the `ASSEMBLY_STATS_URL` path matches the version name of the directory mounted on the downloads server
* update other logos and styles as required
{% endmethod %}

{% method %}
Add images for each species (if available) to `htdocs/i/species`:
* name images to match the `SPECIES.URL` meta parameter
* add a 64 pixel square image to the `64` subdirectory
* add a 48 pixel square image to the `48` subdirectory
{% endmethod %}

{% method %}
Add descriptive text to appear on each assembly home page to `htdocs/ssi/species`:
* name files `about_<SPECIES.URL>.html`
{% endmethod %}

{% method %}
Edit copyright and link details in the perl modules under `modules/EnsEMBL/Web/Document/Element`
{% endmethod %}

{% method %}
Commit and push all changes
{% endmethod %}







{% endmethod %}
