#!/bin/bash

echo "Packaging genomehubs-ui" &&

cd ../genomehubs-ui &&

cp .env.dist .env &&

echo "Bundling javascript" &&

npm run build &&

echo "Archiving build"

tar -C dist -czf dist/genomehubs-ui.tgz public &&

cd - &&

echo "Preparing template" &&

rm -rf src/public &&

mv ../genomehubs-ui/dist/public src/public &&

mkdir -p src/views &&

rm -rf src/views/* &&

TEMPLATE="<% if (variables) { %> \
<script> \
<%- variables %> \
</script> \
<% } %> \
" &&

sed 's:<!---->:'"$TEMPLATE"':' src/public/index.html > src/views/index.ejs &&

rm src/public/index.html &&

echo "Creating package" &&

pkg --compress GZip package.json
