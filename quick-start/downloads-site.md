# Start downloads server

{% method %}
GenomeHubs provides an h5ai container to host files for download. Any files in directories mounted in the container under `/var/www` will be available for download so additional files can be hosted alongside the files generated in previous steps.

{% common %}
![](/assets/GenomeHubs downloads.png)
{% endmethod %}


## Edit files in conf directory

{% method %}
Edit `Masthead.html` to change the site name, logos and link urls:
* add images to the `~/genomehubs/v1/download/conf/img` directory if you wish to include them on your site
* further changes to the appearance can be made by editing the styles in `custom.css`

{% common %}
```
$ cd ~/genomehubs/v1/download/conf
# if you have a google analytics code to track usage
$ sed 's/UA-00000000-0/your analytics code/' Masthead.html
$ nano Masthead.html
# replace references to example.com with your domain name
```
{% endmethod %}

{% method %}
Edit `_h5ai.headers.html` to change the message that will be printed at the top of all directory listings:

{% common %}
```
$ nano _h5ai.headers.html
# replace with your own message
```
{% endmethod %}


## Start h5ai downloads container

{% method %}
Start the h5ai Docker container:

{% common %}
```
$ docker run -d \
             --name genomehubs-h5ai \
             -v ~/genomehubs/v1/download/conf:/conf:ro \
             -v ~/genomehubs/v1/download/data:/var/www/v1:ro \
             -p 8882:8080 \
             genomehubs/h5ai:latest
```
{% endmethod %}


