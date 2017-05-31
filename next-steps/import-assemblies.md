# Import additional assemblies

The Quick Start guide shows an example set up with one species mirrored from an existing Ensembl database and a second species imported directly from FASTA and GFF files. Further assemblies (for the same or different species) can be added from either of these sources to provide a consistent interface to multiple assemblies and to support [comparative analyses](//next-steps/run-compara.md) across a suite of related taxa.

## Mirror additional species from Ensembl/EnsemblGenomes

To mirror additional assemblies from Ensembl/EnsemblGenomes, add then to the `database.ini` file and re-run the [database import](//quick-start/mysql-setup.md#import-ensembl-databases). Existing databases will not be re-imported unless you set the corresponding `_DB_REPLACE` value to 1.

{% method %}
To import additional database types (e.g. variation, funcgen, etc) in addition to the core database add a list of database types to download to `SPECIES_DB_AUTO_EXPAND`:

{% common %}

```
$ nano ~/genomehubs/v1/ensembl/conf/database.ini
SPECIES_DB_AUTO_EXPAND = [ variation funcgen ]
```
{% endmethod %}


## Import additional assemblies from FASTA+GFF

{% method %}
To import additional assemblies, repeat steps 3 to 7 (substituting the new assembly name and details) then remove the SequenceServer and EasyMirror containers:
{% common %}

```
$ docker rm -f genomehubs-sequenceserver
$ docker rm -f genomehubs-ensembl
```
{% endmethod %}

Then follow steps 9 to 11, adding the new assembly database name to `setup.ini` before restarting the EasyMirror container.


 