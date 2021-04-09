#!/usr/bin/env bash

ROOT_DIR="$(realpath "$(dirname "$0")/../")" # need to go up one level because this is in the scripts folder
SERVICE_DIR=${ROOT_DIR}
ENV_FILE=${SERVICE_DIR}/.env

echo "NOTE: If this script doesn't work, you need to set up Lovebird."
echo "You can do that by running ./install-lovebird.sh from within your local lovebird repo."

function start_service() {
	cd ${SERVICE_DIR}
	yarn start
}

start_service