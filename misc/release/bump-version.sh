#/bin/bash
#MIT License

# Copyright (c) 2022 Hau Tran

# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:

# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
#
# Bump one or both of the semantic/mobile versions in appropriate files
#
# usage: './scripts/bump-version.sh -s <major|minor|patch> <-m>
#
# examples:
#    ./scripts/bump-version.sh -s major        # 1.0.0+50 => 2.0.0+50
#    ./scripts/bump-version.sh -s minor -m     # 1.0.0+50 => 1.1.0+51
#    ./scripts/bump-version.sh -m              # 1.0.0+50 => 1.0.0+51
#

SEMANTIC_BUMP="false"
MOBILE_BUMP="false"

while getopts 's:m:' flag; do
  case "${flag}" in
  s) SEMANTIC_BUMP=${OPTARG} ;;
  m) MOBILE_BUMP=${OPTARG} ;;
  *)
    echo "Invalid args"
    exit 1
    ;;
  esac
done

CURRENT_SEMANTIC=$(jq -r '.version' package.json)
MAJOR=$(echo $CURRENT_SEMANTIC | cut -d '.' -f1)
MINOR=$(echo $CURRENT_SEMANTIC | cut -d '.' -f2)
PATCH=$(echo $CURRENT_SEMANTIC | cut -d '.' -f3)

if [[ $SEMANTIC_BUMP == "major" ]]; then
  MAJOR=$((MAJOR + 1))
  MINOR=0
  PATCH=0
elif [[ $SEMANTIC_BUMP == "minor" ]]; then
  MINOR=$((MINOR + 1))
  PATCH=0
elif [[ $SEMANTIC_BUMP == "patch" ]]; then
  PATCH=$((PATCH + 1))
elif [[ $SEMANTIC_BUMP == "false" ]]; then
  echo 'Skipping Semantic Bump'
else
  echo 'Expected <major|minor|patch|false> for the semantic argument'
  exit 1
fi

NEXT_SEMANTIC=$MAJOR.$MINOR.$PATCH

CURRENT_MOBILE=$(sed -rn 's/^[[:space:]]*versionCode ([0-9]+).*$/\1/p' android/app/build.gradle)
NEXT_MOBILE=$CURRENT_MOBILE
if [[ $MOBILE_BUMP == "true" ]]; then
  set $((NEXT_MOBILE++))
elif [[ $MOBILE_BUMP == "false" ]]; then
  echo 'Skipping Mobile Bump'
else
  echo "Fatal: MOBILE_BUMP value $MOBILE_BUMP is invalid"
  exit 1
fi


if [ "$CURRENT_MOBILE" != "$NEXT_MOBILE" ]; then
  echo "Bumping Mobile: $CURRENT_MOBILE => $NEXT_MOBILE"
  npx -y capacitor-set-version -b $NEXT_MOBILE -v $NEXT_SEMANTIC
fi

if [ "$CURRENT_SEMANTIC" != "$NEXT_SEMANTIC" ]; then
  echo "Bumping Semantic: $CURRENT_SEMANTIC => $NEXT_SEMANTIC"
  npm --no-git-tag-version version $SEMANTIC_BUMP
fi


echo "GIRA_VERSION=v$NEXT_SEMANTIC" >>$GITHUB_ENV