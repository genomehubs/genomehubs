#!/bin/bash

cd ./src/genomehubs-api &&

./package.sh &&

cd - &&

cd ./src/packaged-ui &&

./package.sh &&

cd - &&

mkdir -p dist &&

rm -rf dist/* &&

mv ./src/genomehubs-api/dist/genomehubs-api* ./dist/ &&

mv ./src/packaged-ui/dist/genomehubs-ui* ./dist/ &&

chmod 755 ./dist/genomehubs-* &&

mv ./src/genomehubs-ui/dist/genomehubs-ui.tgz ./dist/genomehubs-ui.tgz 
