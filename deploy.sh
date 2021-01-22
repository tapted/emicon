#!/bin/bash
project="$(basename $PWD)"
npm run-script build
cd ../tapted.github.io || exit 1
cp -vr "../${project}/public/"* "${project}" || exit 1
git commit -a || exit 1
git push origin master || exit 1
