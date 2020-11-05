#!/usr/bin/env bash
set -e # The script will exit if any command returns a non zero status code

ROOT_DIR_PATH="$(pwd)"
DIST_DIR_PATH="${ROOT_DIR_PATH}/dist"     # webpack creates this folder
DEPLOY_DIR_PATH="${ROOT_DIR_PATH}/deploy" # nodegui-packer --init creates the "/deploy/darwin/StoreMapper.app" folder
DARWIN_DIR_PATH="${DEPLOY_DIR_PATH}/darwin"
BUILD_DIR_PATH="${DARWIN_DIR_PATH}/build" # # nodegui-packer --pack creates the "/deploy/darwin/build/StoreMapper.app" folder
RESOURCES_DIR_PATH="${ROOT_DIR_PATH}/resources"
OUTPUT_DIR_PATH="${ROOT_DIR_PATH}/output"

BINARY="StoreMapper"
ZIP="${BINARY}$(date "+%Y%m%d")"
ZIP_DIR_PATH="${OUTPUT_DIR_PATH:?}/${ZIP}"
TITLE="Store Mapper (Last Built on: $(date "+%d %b %Y"))"

clean_all() {
  echo "cleaning all..."
  rm -rf ./node_modules
  rm -f ./package-lock.json
  rm -f ./logs.txt
  clean
}

clean() {
    echo "cleaning..."
  rm -rf "${DIST_DIR_PATH:?}"
  rm -rf "${DEPLOY_DIR_PATH:?}"
  rm -rf "${OUTPUT_DIR_PATH:?}"
}

build() {
    echo "building..."
  if [ ! -d "./node_modules" ]; then
    npm install
  fi
  webpack -p                                   # Creates the "/dist" folder
  npx nodegui-packer --init "${BINARY}"        # Creates the "deploy/darwin/StoreMapper.app" folder
  npx nodegui-packer --pack "${DIST_DIR_PATH}" # Creates the "/deploy/darwin/build/StoreMapper.app" folder
  if [ ! -d "${DARWIN_DIR_PATH}" ]; then
    echo "Error: darwin directory doesn't exist ${DARWIN_DIR_PATH}"
    exit
  fi
  # The .app will have to be manually moved to this folder to bypass the Translocation security measure:
  mkdir -p "${ZIP_DIR_PATH}/${BINARY}"
  cp "${RESOURCES_DIR_PATH}/config.json.template" "${ZIP_DIR_PATH}/${BINARY}/config.json"
  cp "${RESOURCES_DIR_PATH}/documentation.pdf" "${ZIP_DIR_PATH}/${BINARY}"
  cp -r "${BUILD_DIR_PATH}/${BINARY}.app" "${ZIP_DIR_PATH}"
  cp "${RESOURCES_DIR_PATH}/salesforce.icns" "${ZIP_DIR_PATH}/${BINARY}.app/Contents/Resources"
  # Yeah it's just faster to do this compared to using SED and deal with escaping XML characters:
  cp "${RESOURCES_DIR_PATH}/Info.plist" "${ZIP_DIR_PATH}/${BINARY}.app/Contents"
  grep -rlF "[INSERT_TITLE]" "${ZIP_DIR_PATH}/${BINARY}.app" | xargs sed -i '' "s/\[INSERT_TITLE\]/${TITLE}/g"
  # The next 3 commands are needed so that the new icon is taken into account by Finder (prob a caching issue)
  cp -r "${ZIP_DIR_PATH}/${BINARY}.app" "${ZIP_DIR_PATH}/${BINARY}.app.bak"
  rm -rf "${ZIP_DIR_PATH}/${BINARY}.app"
  mv "${ZIP_DIR_PATH}/${BINARY}.app.bak" "${ZIP_DIR_PATH}/${BINARY}.app"
  # Zip folder
  cd "${OUTPUT_DIR_PATH}"
  zip -r "${ZIP}.zip" "${ZIP}"
  cd -
}

$1 # the function to invoke just needs to be provided as the first bash script parameter
