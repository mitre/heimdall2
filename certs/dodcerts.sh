yum install -y unzip
url='https://public.cyber.mil/pki-pke/pkipke-document-library/'
bundle=$(curl $url | grep -ioP '(?<=").*dod.zip(?=")')
curl -o dodcerts.zip "$bundle"
unzip -l dodcerts.zip | grep -ioP '.*\s+\K.*.pem' | xargs -I{} unzip -j dodcerts.zip {} -d /etc/pki/ca-trust/source/anchors/
