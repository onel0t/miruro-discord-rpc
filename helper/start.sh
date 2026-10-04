#!/bin/sh
cd "$(dirname "$0")"
npm install --silent
if [ ! -f clientid.txt ]; then printf "Paste your Discord Application ID: "; read ID; echo "$ID" > clientid.txt; fi
CLIENT_ID=$(cat clientid.txt) node server.js
