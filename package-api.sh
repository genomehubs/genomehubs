#!/bin/bash

cd ./src/genomehubs-api &&

npm install &&

./package.sh &&

cd - &&

mkdir -p dist &&

mv ./src/genomehubs-api/dist/genomehubs-api ./dist/genomehubs-api