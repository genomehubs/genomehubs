# Preparation

Docker is the only prerequisite for running GenomeHubs, however, for convenience this quick-start guide assumes that you will be running all steps on Ubuntu 16.04 with git installed and files stored in your home directory.

See [docs.docker.com](https://docs.docker.com) for details on how to install Docker on other operating systems.

{% method %}
### Install packages

Install `docker.io` and `git`:

{% common %}
```
sudo apt install -y docker.io git
sudo usermod -aG docker $USER
```
{% endmethod %}


{% method %}
### Fetch configuration files

Clone the example configuration files from the [genomehubs/template](https://github.com/genomehubs/template) repository:

* naming the template directory `v1` is convenient for versioning of your site

{% common %}
```
$ mkdir ~/genomehubs && cd ~/genomehubs
$ git clone https://github.com/genomehubs/template v1
```
{% endmethod %}


### Configure domain names and firewall

Individual GenomeHubs components can be viewed on a localhost, but to make them publicly available you will need to register a domain name and point it to the ip address of the machine that you are using to host the site. You will also need to open up port 80 to allow external access to the GenomeHubs web sites and ensure that requests for each of the GenomeHubs subdomains. These details are beyond the scope of this guide so if you are unsure what to do, ask your local sysadmin. 

If you follow the conventions in this guide (substitute your domain name for example.com):
* example.com will need to be directed to port 80 on your host server
* ensembl.example.com will need to be redirected by your host server to point to the EasyMirror Docker container running on port 8081
* download.example.com will need to be redirected by your host server to point to the h5ai Docker container running on port 8082
* blast.example.com will need to be redirected by your host server to point to the SequenceServer Docker container running on port 8083

{% method %}
One way to manage the local redirects is to install and configure lighttpd: 

{% common %}
```
$ sudo apt install -y lighttpd
$ sudo nano /etc/lighttpd/lighttpd.conf

# Append at end of file:
$HTTP["host"] =~ "ensembl.example.com"{
  proxy.server = ("" => ("" => (
    "host" => "127.0.0.1",
    "port" => "8081",
    "fix-redirects" => 1
  )))
}
$HTTP["host"] =~ "download.example.com"{
  proxy.server = ("" => ("" => (
    "host" => "127.0.0.1",
    "port" => "8082",
    "fix-redirects" => 1
  )))
}
$HTTP["host"] =~ "blast.example.com"{
  proxy.server = ("" => ("" => (
    "host" => "127.0.0.1",
    "port" => "8083",
    "fix-redirects" => 1
  )))
}

$ sudo service lighttpd restart
```
{% endmethod %}

{% method %}
To test without configuring an external domain name you could add entries to `/etc/hosts` on your local machine (substitute the ip below for the ip address of your host server: 
* remember to remove these entries if you later register the domain
* if you are unsure what you are doing, ask your local sysadmin before editing this file

{% common %}
```
192.168.122.1  ensembl.example.com
192.168.122.1  download.example.com
192.168.122.1  blast.example.com
```
{% endmethod %}


