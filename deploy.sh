#!/bin/bash
project="$(basename $PWD)"
npm run-script build
cp node_modules/@zip.js/zip.js/dist/zip-no-worker-deflate.min.js public/js/deflate.js
cd ../tapted.github.io || exit 1
git pull || exit 1
cp -vr "../${project}/public/"* "${project}" || exit 1
git commit -a || exit 1
git push origin master || exit 1
