# Demo

If you already have a server running Docker, the quickest way to try out GenomeHubs is to run our demo import script in the [genomehubs/demo](https://github.com/genomehubs/demo) GitHub repository:

```
cd
git clone https://github.com/genomehubs/demo
cd demo
import.sh
```

This sets up a GenomeHub with an Ensembl browser, SequenceServer BLAST server and h5ai downloads server hosting data from one species mirrored from EnsemblGenomes and another imported from FASTA and GFF files in around an hour.

Once loaded the Ensembl site will be available at `127.0.0.1:8881`. If are running this demo on another server via ssh you can add an entry to your `.ssh/config` file so you can ssh `dockerserver` to forward ports for the Ensembl, BLAST and downloads sites:

* replace the HostName and User with values relevant to you

```
$ nano ~/.ssh/config
Host dockerserver
 HostName example.com
 LocalForward 8881 127.0.0.1:8881
 LocalForward 8882 127.0.0.1:8882
 LocalForward 8883 127.0.0.1:8883
 User username
```



