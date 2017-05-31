# Setup with multiple hosts

The quick-start guide assumes you will be running all steps on a single host as this is the simplest case. Although such a setup is useful for testing, in production you will almost certainly want to run the components of GenomeHubs on separate hosts.

Changing settings to run GenomeHubs in this way has additional security implications so make sure you understand how to manage your firewall or ask you local sysadmin for advice.

## Accessing the MySQL container from other machines

The default settings (specifying the database host as the MySQL container name and allowing access from the `172.17.0.0` network) allow access to the MySQL container from any linked container on the same host.

Changing these settings require updating the MySQL container.  This can be done manually using `docker exec -it genomehubs-mysql bash` then logging in to mysql as root, or by updating the settings in `ensembl/conf/database.ini` and re-running the `database.sh` script in the EasyMirror container ([described here](//quick-start/mysql-setup.md#import-ensembl-databases)), which will add new users without re-downloading the databases.

To allow access from Docker containers on other hosts one option would be to use Docker Swarm mode, which will set up an overlay network and allow linked containers to be on different hosts. If you have machines connected in a Docker Swarm, all that should be needed for this approach is to change the network component of the database users setup in `ensembl/conf/database.ini` to match the overlay network and netmask (probably `172.18.0.0/255.255.0.0`).

A more general solution if you have machines connected on a private network is to specify your local network and netmask (e.g. `192.168.0.0/255.255.255.0`) when adding users and connect to the mysql server by setting the database host to the IP of the server running the MySQL docker container. The example commands map port 3306 on the MySQL container to port 3306 on the host so you will be able to connect directly to the Docker container via the host IP. You will no longer need to link the MySQL container to the EasyMirror and EasyImport containers when running them in this way.

## Running analyses on a separate cluster

Running analyses on a separate machine or cluster separates the compute intensive aspects of setting up a GenomeHub from the hosting and makes it easier to adopt more secure practices (such as user namespace remapping) on the public-facing containers.  

The analysis containers can all be run independently, provided they have the correct files available and the equivalent  analyses can also be run using the underlying tools directly  if Docker is not supported on your cluster. The only caveat is that they must generate files with the expected names and format in order for the import scripts to work.

In order to run the import/export scripts on a separate machine, the EasyImport container requires access to the MySQL database server, which can be set up as described in the previous section.

## Formatting BLAST databases for SequenceServer

The SequenceServer needs write access to the directory mounted at `/dbs` in order to format the BLAST databases. If you would prefer to run SequenceServer with read-only access to this directory, you can pre-format the databases using the SequenceServer container without running the BLAST server using a command similar to the following:

```
$ docker run --rm \
             -u $UID:$GROUPS \
             --name sequenceserver-format \
             -v /path/to/data:/dbs \
             genomehubs/sequenceserver:latest \
             /usr/local/bin/bundle exec /sequenceserver/bin/sequenceserver -b /usr/bin -m -c /sequenceserver.conf
```