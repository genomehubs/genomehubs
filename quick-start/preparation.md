# Preparation

Docker is the only prerequisite for running GenomeHubs, however, for convenience this quick-start guide assumes that you will be running all steps on Ubuntu 16.04 with git installed and files stored in your home directory.

See [docs.docker.com](https://docs.docker.com) for details on how to install Docker on other operating systems.

{% method %}
### Install packages

Install `docker.io` and `git`:

{% common %}
```bash
sudo apt install -y docker.io git
```
{% endmethod %}


{% method %}
### Fetch configuration files

Clone the example configuration files from the [genomehubs/template](https://github.com/genomehubs/template) repository:

* naming the template directory `v1` is convenient for versioning of your site

{% common %}
```bash
$ mkdir ~/genomehubs && cd ~/genomehubs
$ git clone https://github.com/genomehubs/template v1
```
{% endmethod %}

