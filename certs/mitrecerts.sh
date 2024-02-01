#!/bin/bash

set -o nounset
set -o pipefail
set -o xtrace

echo "Starting to download the MITRE certs..."

# MITRE requires two sets of certs
url1='http://pki.mitre.org/MITRE-chain.txt'
url2='http://pki.mitre.org/ZScaler_Root.crt'

# check if there is an internet connection
curl -I --connect-timeout 2 --retry 2 "$url1" | head -1 | grep 200
if [[ $? -ne 0 ]]; then
  echo "Was not able to connect to $url.  Exiting now..." >&2
  exit 1
fi

# download the certs to /etc/pki/ca-trust/source/anchors which is where RedHat systems expect unprocessed certs to be stored
# reminder that this script will be run in a UBI container which is why we use that particular path
curl -o /etc/pki/ca-trust/source/anchors/mitre_certs.pem "$url1"
curl -o /etc/pki/ca-trust/source/anchors/zscaler_certs.pem "$url2"

echo "Finished downloading the MITRE certs..."
