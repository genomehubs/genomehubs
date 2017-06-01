#Demo

If you already have a server running Docker, the quickest way to try out GenomeHubs is to run our demo import script in the [genomehubs/demo](https://github.com/genomehubs/demo) GitHub repository:

```
cd
git clone https://github.com/genomehubs/demo
demo/import.sh
```

This sets up a GenomeHub with an Ensembl browser, SequenceServer BLAST server and h5ai downloads server hosting data from one species mirrored from EnsemblGenomes and another imported from FASTA and GFF files in around an hour.

Once loaded the Ensembl site will be available at `127.0.0.1:8081`. If are running this demo on another server via ssh you can add an entry to your `.ssh/config` file so you can ssh `dockerserver` to forward ports for the Ensembl, BLAST and downloads sites:
- replace the HostName and User with values relevant to you

```
$ nano ~/.ssh/config
Host dockerserver
 HostName example.com
 LocalForward 8081 127.0.0.1:8081
 LocalForward 8082 127.0.0.1:8082
 LocalForward 8083 127.0.0.1:8083
 User username
```