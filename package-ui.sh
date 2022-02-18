#!/bin/bash

cd ./src/packaged-ui &&

npm install &&

./package.sh &&

cd - &&

mkdir -p dist &&

rm -rf dist/* &&

mv ./src/packaged-ui/dist/genomehubs-ui ./dist/genomehubs-ui &&

chmod 755 ./dist/genomehubs-* &&

mv ./src/genomehubs-ui/dist/genomehubs-ui.tgz ./dist/genomehubs-ui.tgz 
