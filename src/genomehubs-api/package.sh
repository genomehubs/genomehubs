#!/bin/bash

echo "Packaging genomehubs-api" &&

mkdir -p build &&

rm -rf build/* &&

FILES=$(find src/api -name "*.js") &&

echo "Transpiling esm files to cjs" &&
for FILE in $FILES; do
  OUTFILE=${FILE/src/build} &&
  echo " - transpiling $FILE to $OUTFILE" &&
  mkdir -p $(dirname $OUTFILE) &&
  npx babel --plugins @babel/plugin-transform-modules-commonjs $FILE > $OUTFILE
done &&

echo " - transpiling src/app.js to build/app.js" &&
npx babel --plugins @babel/plugin-transform-modules-commonjs src/app.js > build/app.js &&

echo "Copying files" &&

mkdir -p build/api-docs &&

cp src/api-v2.yaml build/ &&

cp node_modules/swagger-ui-dist/* build/api-docs/ &&

cp node_modules/swagger-ui-express/* build/api-docs/ &&

cp .env.dist .env &&

# nexe -t mac-x64-14.15.3 build/app.js &&

echo "Creating package" &&

pkg --compress GZip package.json
