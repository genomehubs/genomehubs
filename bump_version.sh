#!/bin/bash

LEVEL=$1

if [ -z "$LEVEL" ]; then
  echo "Usage: ./bump_version.sh major|minor|patch"
  exit 1;
fi

cd src/genomehubs-api &&

npm version --no-git-tag-version $LEVEL &&

cd - &&

cd src/genomehubs-ui &&

npm version --no-git-tag-version $LEVEL &&

cd - &&

cd src/packaged-ui &&

npm version --no-git-tag-version $LEVEL &&

cd - &&

git commit -a -m "bump UI/API version"

bump2version $LEVEL
