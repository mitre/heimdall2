#!/bin/bash

if [ -f apps/backend/.env ]; then
	echo ".env already exists, so all unset environment variables will now be filled by default values. If you would like to completely regenerate your secrets, please delete this file and then re-run the script."
else
	echo ".env does not exist, creating..."
	(umask 066; touch apps/backend/.env)
fi

if ! grep -qF "NODE_ENV" apps/backend/.env; then
	echo "NODE_ENV=development" >> apps/backend/.env
fi

if ! grep -qF "DATABASE_USERNAME" apps/backend/.env; then
	read -p "Enter DATABASE_USERNAME (leave blank to use default 'postgres'): " usr
	echo "DATABASE_USERNAME=$usr" >> apps/backend/.env
fi

if ! grep -qF "DATABASE_PASSWORD" apps/backend/.env; then
	read -s -p 'Enter DATABASE_PASSWORD (leave blank to not set a password): ' psswd
	echo ""
	echo "DATABASE_PASSWORD=$psswd" >> apps/backend/.env
fi

if ! grep -qF "JWT_EXPIRE_TIME" apps/backend/.env; then
	read -p 'Enter JWT_EXPIRE_TIME ex. 1d or 25m: ' expire
	echo "JWT_EXPIRE_TIME=$expire" >> apps/backend/.env
fi

if ! grep -qF "JWT_SECRET" apps/backend/.env; then
	echo "JWT_SECRET=$(openssl rand -hex 64)" >> apps/backend/.env
fi

if ! grep -qF "API_KEY_SECRET" apps/backend/.env; then
	read -p "apps/backend/.env does not contain API_KEY_SECRET, would you like to enable API Keys? [Y/n]" -n 1 -r
	echo ""
	if [[ $REPLY =~ ^[Yy]$ ]]
	then
		echo "API_KEY_SECRET=$(openssl rand -hex 33)" >> apps/backend/.env
	fi
fi

if ! grep -qF "NGINX_HOST" apps/backend/.env; then
	echo "apps/backend/.env does not contain NGINX_HOST..."
	read -p 'Enter your FQDN/Hostname/IP Address: ' fqdn
	echo "NGINX_HOST=$fqdn" >> apps/backend/.env
fi

if [ -f ./nginx/certs/ssl_certificate.crt ]; then
	echo "SSL Certificate already exists. If you would like to regenerate your certificates, please delete the files in ./nginx/certs/ and re-run this script."
else
	echo "SSL Certificate does not exist, creating self-signed certificate..."
	echo "Be sure your production environment is configured to work with your self-signed certificate."
	echo
	echo "Generating certificate (Expires in 7 days)..."
	openssl req -newkey rsa:4096 \
							-x509 \
							-sha256 \
							-days 7 \
							-nodes \
							-out nginx/certs/ssl_certificate.crt \
							-keyout nginx/certs/ssl_certificate_key.key \
							-subj "/C=US/ST=SelfSigned/L=SelfSigned/O=SelfSigned/OU=SelfSigned"
fi

echo "Done"
