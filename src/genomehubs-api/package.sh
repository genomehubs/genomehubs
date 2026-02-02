#!/bin/bash

set -euo pipefail

echo "Packaging genomehubs-api"

echo "Installing dependencies"
npm install --legacy-peer-deps

echo "Preparing build directory"
mkdir -p build
# Clean up any stray files or directories that start with a double-quote (leftover from earlier sed/insert attempts)
find . -maxdepth 1 -type d -name '"*' -print0 | xargs -0 rm -rf || true
# also remove stray files starting with a double-quote
find . -maxdepth 1 -type f -name '"*' -print0 | xargs -0 rm -f || true
# leacve build contents for incremental builds
# rm -rf build/*
echo '{"type":"commonjs"}' > build/package.json

if [ "${USE_WEBPACK:-0}" -eq 1 ]; then
	echo "Skipping local source transpile because USE_WEBPACK=1; webpack will bundle ESM sources"
else
	echo "Transpiling source files to CommonJS"
	if [ -d src/api ]; then
		FILES=$(find src/api -name "*.js")
		for FILE in $FILES; do
			OUTFILE=${FILE/src/build}
			mkdir -p "$(dirname "$OUTFILE")"
			if [ -f "$OUTFILE" ] && [ "$OUTFILE" -nt "$FILE" ]; then
				echo " - up-to-date, skipping $OUTFILE"
				continue
			fi
			echo " - transpiling $FILE to $OUTFILE"
			npx babel --plugins @babel/plugin-transform-modules-commonjs "$FILE" -o "$OUTFILE"
		done
	else
		echo " - no src/api directory, skipping source transpile"
	fi
fi

npm_bin_sed() { sed -i "" -e "$1" "$2"; }

if [ "${USE_WEBPACK:-0}" -eq 1 ]; then
	echo "Skipping src/app.js transpile because USE_WEBPACK=1; webpack will produce a CJS bundle"
else
	echo " - transpiling src/app.js to build/app.cjs"
	if [ -f build/app.cjs ] && [ build/app.cjs -nt src/app.js ]; then
		echo " - build/app.cjs is up-to-date, skipping app transpile"
	else
		npm_bin_sed '/^const __filename/d' src/app.js
		npm_bin_sed '/^const __dirname/d' src/app.js
		npm_bin_sed '/^import esmResolver/d' src/app.js
		npm_bin_sed 's/esmResolver(path.join(__dirname))/path.join(__dirname)/g' src/app.js
		npx babel --plugins @babel/plugin-transform-modules-commonjs src/app.js -o build/app.cjs
	fi
fi

echo "Copying files"
mkdir -p build/api-docs
cp src/api-v2.yaml build/
cp node_modules/swagger-ui-dist/* build/api-docs/ || true
cp node_modules/swagger-ui-express/* build/api-docs/ || true
cp .env.dist .env

echo " - relying on pkg assets for problematic node_modules (see package.json pkg.assets)"

echo " - removing any build/node_modules (we bundle dependencies instead)"
rm -rf build/node_modules || true

if [ "${USE_WEBPACK:-0}" -eq 1 ]; then
  echo "Bundling with webpack"
  npm run build:webpack
else
	echo "Generating all-routes import file"
	node scripts/generate-all-routes.cjs
	echo "Bundling with esbuild"
	npm run build:bundle
fi

echo "Creating package from bundle"
# Temporarily point package.json bin to the correct bundled file so pkg picks it up
node -e "const fs=require('fs'); const p='package.json'; const j=JSON.parse(fs.readFileSync(p)); j._old_bin=j.bin; j.bin=(process.env.USE_WEBPACK==1)?'build/webpack-bundle.cjs':'build/bundle.cjs'; fs.writeFileSync(p, JSON.stringify(j,null,2));"
pkg --compress GZip package.json
# restore package.json bin
node -e "const fs=require('fs'); const p='package.json'; const j=JSON.parse(fs.readFileSync(p)); if(j._old_bin){ j.bin=j._old_bin; delete j._old_bin; } else { delete j.bin; } fs.writeFileSync(p, JSON.stringify(j,null,2));"
