url1='http://pki.mitre.org/MITRE-chain.txt'
url2='http://pki.mitre.org/ZScaler_Root.crt'
curl -o /etc/pki/ca-trust/source/anchors/mitre_certs.pem "$url1"
curl -o /etc/pki/ca-trust/source/anchors/zscaler_certs.pem "$url2"
