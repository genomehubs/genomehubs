#!/bin/bash

echo "Packaging genomehubs-ui" &&

cd ../genomehubs-ui &&

cp .env.dist .env &&

echo "Installing dependencies" &&

npm install &&

echo "Setting build date" &&

sed -i.bak 's|'"$(grep 'const buildDate' src/client/views/index.jsx)"'|const buildDate = "'"$(date)"'";|' src/client/views/index.jsx &&

rm src/client/views/index.jsx.bak

echo "Bundling javascript" &&

GH_PAGES_PATH=$1 npm run build &&

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

echo "Installing package dependencies" &&

npm install &&

echo "Creating package" &&

pkg --compress GZip package.json
