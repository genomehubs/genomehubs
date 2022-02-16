#!/bin/bash

echo "Packaging viewer"

TEMPLATE="<% if (variables) { %> \
<script> \
<%- variables %> \
</script> \
<% } %> \
"

# cp .env.dist .env &&

cd ./src/genomehubs-ui &&

npm run build &&

cd - &&

rm -rf ./src/packaged-ui/src/public &&

tar -C ./src/genomehubs-ui/dist -czf ./src/genomehubs-ui/dist/blobtoolkit-viewer.tgz public &&

mv ./src/genomehubs-ui/dist/public ./src/packaged-ui/src/ &&

mkdir -p ./src/packaged-ui/src/views &&

rm -rf ./src/packaged-ui/src/views/* &&

sed 's:<!---->:'"$TEMPLATE"':' ./src/packaged-ui/src/public/index.html > ./src/packaged-ui/src/views/index.ejs &&

cd ./src/packaged-ui &&

pkg --compress GZip package.json &&

cd -