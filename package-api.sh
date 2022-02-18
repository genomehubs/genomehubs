#!/bin/bash

cd ./src/genomehubs-api &&

./package.sh &&

cd - &&

mkdir -p dist &&

mv ./src/genomehubs-api/dist/genomehubs-api ./dist/genomehubs-api