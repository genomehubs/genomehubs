#!/bin/bash

echo "Packaging genomehubs-ui" &&

cd ../genomehubs-ui &&

cp .env.dist .env &&

echo "Installing dependencies" &&

npm install --legacy-peer-deps &&

if [ ! -z "$1" ]; then
  echo "Setting pages version" &&

  PAGES_VERSION=$(cd $1 && git rev-parse --short HEAD)

  sed -i.bak 's|'"$(grep 'const pagesVersion' src/client/views/index.jsx)"'|const pagesVersion = "'"${PAGES_VERSION}"'";|' src/client/views/index.jsx &&

  rm src/client/views/index.jsx.bak
fi

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

# TEMPLATE="<% if (variables) { %> \
# <script> \
# <%- variables %> \
# </script> \
# <% } %> \
# " &&

# sed 's:<!---->:'"$TEMPLATE"':' src/public/index.html > src/views/index.ejs &&
mv src/public/index.html src/views/index.ejs &&

# rm src/public/index.html &&

echo "Installing package dependencies" &&

npm install --legacy-peer-deps &&

echo "Creating package" &&

pkg --compress GZip package.json
