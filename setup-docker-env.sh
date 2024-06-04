#!/bin/bash

if [ -f .env ]; then
	echo ".env already exists, if you would like to regenerate your secrets, please delete this file and re-run the script. WARNING: Re-running this script will cause the database password to be reset within the .env file, but the database will still be expecting the old password.  If this happens, you can 1) change DATABASE_PASSWORD in the .env file back to the old password, 2) connect to the database directly and reset the password to the newly generated one, or 3) remove the 'data/' folder (which will delete all data)."
	
else
	echo ".env does not exist, creating..."
	(umask 066; touch .env)
fi

if ! grep -qF "DATABASE_PASSWORD" .env; then
	echo ".env does not contain DATABASE_PASSWORD, generating secret..."
	echo "DATABASE_PASSWORD=$(openssl rand -hex 33)" >> .env
fi

if ! grep -qF "JWT_EXPIRE_TIME" .env; then
	read -p 'Enter JWT_EXPIRE_TIME ex. 1d or 25m: ' expire
	echo "JWT_EXPIRE_TIME=$expire" >> .env
fi

if ! grep -qF "JWT_SECRET" .env; then
	echo "JWT_SECRET=$(openssl rand -hex 64)" >> .env
fi

if ! grep -qF "API_KEY_SECRET" .env; then
	read -p ".env does not contain API_KEY_SECRET, would you like to enable API Keys? [Y/n]" -n 1 -r
	echo ""
	if [[ $REPLY =~ ^[Yy]$ ]]
	then
		echo "API_KEY_SECRET=$(openssl rand -hex 33)" >> .env
	fi
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
							-keyout nginx/certs/ssl_certificate_key.key \
							-subj "/C=US/ST=SelfSigned/L=SelfSigned/O=SelfSigned/OU=SelfSigned"
fi

echo "Done"
