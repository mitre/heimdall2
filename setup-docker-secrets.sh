#!/bin/bash

if [ -f .env ]; then
	echo ".env already exists, if you would like to regenerate your secrets, please delete this file and re-run the script."
else
	echo ".env does not exist, creating..."
	(umask 066; touch .env)
fi

if ! grep -qF "DATABASE_PASSWORD" .env; then
	echo ".env does not contain DATABASE_PASSWORD, generating secret..."
	echo "DATABASE_PASSWORD=$(openssl rand -hex 33)" >> .env
fi

if [ -f .env-prod ]; then
	echo ".env-prod already exists, if you would like to regenerate your secrets, please delete this file and re-run the script."
else
	echo ".env-prod does not exist, creating..."
  read -p 'Enter JWT_EXPIRE_TIME ex. 1d or 25m: ' expire
  cat >.env-prod - << EOF
JWT_SECRET=$(openssl rand -hex 64)
JWT_EXPIRE_TIME=$expire
EOF
fi

if ! grep -qF "NGINX_HOST" .env; then
	echo ".env does not contain NGINX_HOST..."
	read -p 'Enter your FQDN/Hostname/IP Address: ' fqdn
	echo "NGINX_HOST=$fqdn" >> .env
fi

if [ -f ./nginx/certs/ssl_certificate.crt ]; then
	echo "SSL Certificate already exists. if you would like to regenerate your certificates, please delete the files in ./nginx/certs/ and re-run this script."
else
	echo "SSL Certificate does not exist, creating self-signed certificate..."
	echo "Do not use a self-signed certificate in a production environment."
	echo
	echo "Generating certificate (Expires in 7 days)..."
	openssl req -newkey rsa:4096 \
							-x509 \
							-sha256 \
							-days 7 \
							-nodes \
							-out nginx/certs/ssl_certificate.crt \
							-keyout nginx/certs/ssl_certificate_key.key
fi

echo "Done"
