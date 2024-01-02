#!/bin/bash
INPUTS=android/app/build/outputs
bun run build
bunx cap sync android
cd android
./gradlew assembleRelease
./gradlew bundleRelease
cd ..
mkdir -p misc/outputs
cp $INPUTS/apk/release/app-release-unsigned.apk misc/outputs/gira.apk
apksigner sign --ks misc/release/android-release.keystore --ks-key-alias release misc/outputs/gira.apk
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore misc/release/android-release.keystore -signedjar misc/outputs/gira-signed.aab $INPUTS/bundle/release/app-release.aab release