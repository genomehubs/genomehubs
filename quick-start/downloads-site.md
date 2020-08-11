# 8. Start download site

GenomeHubs provides an h5ai container to host files for download. Any files in directories mounted in the container under `/var/www/html` will be available for download so additional files can be hosted alongside the files generated in previous steps.

![](../.gitbook/assets/GenomeHubs%20downloads.png)

## Edit files in conf directory

Edit `Masthead.html` to change the site name, logos and link urls:

* add images to the `~/genomehubs/v1/download/conf/img` directory if you wish to include them on your site
* further changes to the appearance can be made by editing the styles in `custom.css`

```text
$ cd ~/genomehubs/v1/download/conf
$ nano Masthead.html
# replace references to example.com with your domain name
```

Edit `_h5ai.headers.html` to change the message that will be printed at the top of all directory listings:

```text
$ nano _h5ai.headers.html
# replace with your own message
```

## Start h5ai downloads container

Start the h5ai Docker container:

```text
$ docker run -d \
             --name genomehubs-download \
             -v ~/genomehubs/v1/download/conf:/conf:ro \
             -v ~/genomehubs/v1/download/data:/var/www/html/v1:ro \
             -p 8882:8080 \
             genomehubs/h5ai:19.05
```

