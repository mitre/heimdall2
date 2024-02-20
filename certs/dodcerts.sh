#!/bin/bash

set -o nounset
set -o pipefail
set -o xtrace

echo "Starting to download the DoD certs..."

# general DoD certs are available from public.cyber.mil
url='https://public.cyber.mil/pki-pke/pkipke-document-library/'

# check if there is an internet connection
curl -I --connect-timeout 2 --retry 2 "$url" | head -1 | grep 200
if [[ $? -ne 0 ]]; then
  echo "Was not able to connect to $url.  Exiting now..." >&2
  exit 1
fi

# download and install dependencies
# unzip = handle the cert bundle (which is a zip file)
# openssl = convert from DER to PEM formats
yum install -y unzip openssl

# get the download url for the cert bundle
bundle=$(curl "$url" | grep -ioP '(?<=").*dod.zip(?=")')

# download the cert bundle
curl -o dodcerts.zip "$bundle"

# unzip the cert chain, convert it to PEM from DER, and move it to /etc/pki/ca-trust/source/anchors which is where RedHat systems expect unprocessed certs to be stored
# reminder that this script will be run in a UBI container which is why we use that particular path
chainfile=$(unzip -l dodcerts.zip | grep -ioP '.*\s+\K.*dod_der.p7b')
unzip -o -j dodcerts.zip "$chainfile" -d /tmp
openssl pkcs7 -in "/tmp/$(basename $chainfile)" -inform der -print_certs -out /etc/pki/ca-trust/source/anchors/dod_certs.pem

echo "Finished downloading the DoD certs..."
