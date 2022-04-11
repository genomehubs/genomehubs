#!/usr/bin/env bash

VERSION=2.4.1

case $(uname | tr '[:upper:]' '[:lower:]') in
  linux*)
    export OS_NAME=linux
    ;;
  darwin*)
    export OS_NAME=osx
    ;;
  msys*)
    export OS_NAME=win
    ;;
  *)
    export OS_NAME=notset
    ;;
esac
CONDA_DIR=$(which conda | sed "s:bin/conda:conda-bld/${OS_NAME}-64:")

eval "$(conda shell.bash hook)"

for PYTHON in 3.6 3.7 3.8; do
  conda build --python $PYTHON conda-recipe &&
  PYTHON=$(echo $PYTHON | sed "s:3\.:py3:") &&
  if [ "$OS_NAME" != "linux" ]; then
    conda convert --platform linux-64 $CONDA_DIR/genomehubs-${VERSION}-${PYTHON}_0.tar.bz2 -o dist/conda
  fi &&
  if [ "$OS_NAME" != "osx" ]; then
    conda convert --platform osx-64 $CONDA_DIR/genomehubs-${VERSION}-${PYTHON}_0.tar.bz2 -o dist/conda
  fi &&
  if [ "$OS_NAME" != "win" ]; then
    conda convert --platform win-64 $CONDA_DIR/genomehubs-${VERSION}-${PYTHON}_0.tar.bz2 -o dist/conda
  fi &&
  mkdir -p dist/conda/${OS_NAME}-64 &&
  cp $CONDA_DIR/genomehubs-${VERSION}-${PYTHON}_0.tar.bz2 dist/conda/${OS_NAME}-64/ &&
  conda create -y -c $CONDA_DIR -n test_genomehubs --force genomehubs &&
  conda activate test_genomehubs &&
  genomehubs -v &&
  conda deactivate &&
  for FILE in dist/conda/*/*-$VERSION-${PYTHON}_0.tar.bz2; do
    anaconda -t $CONDA_TOKEN upload $FILE
  done ||
  conda deactivate
done
