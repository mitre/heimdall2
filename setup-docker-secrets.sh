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

if ! grep -qF "JWT_SECRET" .env; then
	echo ".env does not contain JWT_SECRET, generating secret..."
	echo "JWT_SECRET=$(openssl rand -hex 64)" >> .env
fi



