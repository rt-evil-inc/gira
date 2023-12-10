bun run build && 
bunx cap sync &&
cd android &&
ANDROID_HOME=/opt/android-sdk/ ./gradlew build --info