#!/bin/bash
INPUTS=android/app/build/outputs
bun run build
bunx cap sync android
cd android
./gradlew assembleRelease bundleRelease
cd ..
mkdir -p misc/outputs
cp $INPUTS/apk/release/app-release.apk misc/outputs/gira.apk
cp $INPUTS/bundle/release/app-release.aab misc/outputs/gira.aab