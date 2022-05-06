#!/bin/bash

cd ./src/packaged-ui &&

./package.sh $1 &&

cd - &&

mkdir -p dist &&

rm -rf dist/* &&

mv ./src/packaged-ui/dist/genomehubs-ui* ./dist/ &&

mv ./src/genomehubs-ui/dist/genomehubs-ui* ./dist/
