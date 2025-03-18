#!/bin/bash

# Function to display help information
function display_help() {
	echo "Usage: source ./setup-dev-env.sh [OPTION]"
	echo
	echo "Set up the development environment for the application."
	echo "This script checks for necessary environment variables and prompts the user to enter values for them if they are not set."
	echo "It also generates secrets for JWT and API keys, and creates a self-signed SSL certificate if one does not exist."
	echo
	echo "Options:"
	echo "  --help        Display this help message and exit"
	echo "  --regenerate  Unset environment variables and force the recreation of the .env file"
	return 0
}

# Check if the --help option was provided
if [ "$1" = "--help" ]; then
	display_help
fi

# Check if the script is being sourced or executed
if [ "$$" = "$PPID" ]; then
    echo "This script is being executed. Please source this script instead to ensure environment variables are set correctly in your shell."
    echo "Use: 'source ./setup-dev-env.sh' or '. ./setup-dev-env.sh'"
    exit 1
fi

# Define the path to the .env file
# This is where we will store our environment variables
ENV_FILE_PATH="apps/backend/.env"

# Define the environment variables that the script uses
ENV_VARS=("NODE_ENV" "DATABASE_USERNAME" "DATABASE_PASSWORD" "JWT_EXPIRE_TIME" "JWT_SECRET" "API_KEY_SECRET" "NGINX_HOST")

# Check if the --regenerate option was provided
if [ "$1" = "--regenerate" ]; then
	echo "Regenerating .env file and unsetting environment variables..."
	rm -f $ENV_FILE_PATH
	for var in "${ENV_VARS[@]}"; do
		unset $var
	done
fi

# Function to check if a variable exists in the .env file
# Returns 1 if the variable does not exist, 0 otherwise
function check_env_var() {
	if ! grep -qF "$1" $ENV_FILE_PATH; then
		return 1
	fi
	return 0
}

# Function to ask for user input with a default value
# If the user does not provide any input, the default value is used
function ask_user_input() {
    echo -n "$1"
    read usr
    if [ -z "$usr" ]; then
        usr=$3
    fi
    echo "$2=$usr" >> $ENV_FILE_PATH
}


# This script is used to set up the development environment for the application.
# It checks for necessary environment variables and prompts the user to enter values for them if they are not set.
# It also generates secrets for JWT and API keys, and creates a self-signed SSL certificate if one does not exist.

# Function to check if openssl is installed and install it if not
# OpenSSL is used to generate random secrets and to create a self-signed SSL certificate.
# The function first checks if openssl is installed by using the `command -v` command, which returns 0 if the command exists and 1 otherwise.
# If openssl is not installed, it attempts to install it using the appropriate package manager.
# If the package manager cannot be determined, it informs the user to install openssl manually and exits the script.
function check_and_install_openssl() {
	if ! command -v openssl &> /dev/null; then
		echo "openssl could not be found"
		echo "Attempting to install openssl..."
		if [[ "$OSTYPE" == "linux-gnu"* ]]; then
			# Assume Debian-based Linux if apt-get is available
			if command -v apt-get &> /dev/null; then
				sudo apt-get update
				sudo apt-get install -y openssl
			# Assume RHEL-based Linux if yum is available
			elif command -v yum &> /dev/null; then
				sudo yum install -y openssl
			else
				echo "Could not determine package manager. Please install openssl manually."
				exit 1
			fi
		elif [[ "$OSTYPE" == "darwin"* ]]; then
			# Assume MacOS
			if command -v brew &> /dev/null; then
				brew install openssl
			else
				echo "Homebrew is not installed. Please install openssl manually."
				exit 1
			fi
		else
			echo "Unsupported operating system. Please install openssl manually."
			exit 1
		fi
	fi
}

# Call the function to check and install openssl
check_and_install_openssl

# Function to generate a random secret
# The secret is added to the .env file
function generate_secret() {
	echo "$1=$(openssl rand -hex $2)" >> $ENV_FILE_PATH
}

# Check if .env file exists
# If it does not exist, create it
# If it does exist, inform the user that any unset environment variables will be filled with default values
if [ -f $ENV_FILE_PATH ]; then
	echo ".env already exists, so all unset environment variables will now be filled by default values. If you would like to completely regenerate your secrets, please delete this file and then re-run the script."
else
	echo ".env does not exist, creating..."
	(umask 066; touch $ENV_FILE_PATH)
fi

# Check for each environment variable and ask for user input if not found
# If the variable does not exist in the .env file, the user is asked to provide a value
# If the user does not provide a value, a default value is used
check_env_var "NODE_ENV" || echo "NODE_ENV=development" >> $ENV_FILE_PATH
check_env_var "DATABASE_USERNAME" || ask_user_input "Enter DATABASE_USERNAME (leave blank to use default 'postgres'): " "DATABASE_USERNAME" "postgres"
check_env_var "DATABASE_PASSWORD" || ask_user_input 'Enter DATABASE_PASSWORD (leave blank to not set a password): ' "DATABASE_PASSWORD" ""
check_env_var "JWT_EXPIRE_TIME" || ask_user_input 'Enter JWT_EXPIRE_TIME ex. 1d or 25m (leave blank to use default '1d'): ' "JWT_EXPIRE_TIME" "1d"
check_env_var "JWT_SECRET" || generate_secret "JWT_SECRET" 64
check_env_var "API_KEY_SECRET" || generate_secret "API_KEY_SECRET" 33
check_env_var "NGINX_HOST" || ask_user_input 'Enter your FQDN/Hostname/IP Address (leave blank to use default 'localhost'): ' "NGINX_HOST" "localhost"

# Check for SSL certificate
# If it does not exist, create a self-signed certificate
# If it does exist, inform the user that they can regenerate the certificate by deleting the existing one and re-running the script
if [ -f ./nginx/certs/ssl_certificate.crt ]; then
	echo "SSL Certificate already exists. If you would like to regenerate your certificates, please delete the files in ./nginx/certs/ and re-run this script."
else
	echo "SSL Certificate does not exist, creating self-signed certificate..."
	echo "Be sure your production environment is configured to work with your self-signed certificate."
	echo
	read -rp "Enter the number of days until the certificate expires (leave blank to use default 7): " days
	days=${days:-7}
	echo "Generating certificate (Expires in $days days)..."
	openssl req -newkey rsa:4096 \
				-x509 \
				-sha256 \
				-days $days \
				-nodes \
				-out nginx/certs/ssl_certificate.crt \
				-keyout nginx/certs/ssl_certificate_key.key \
				-subj "/C=US/ST=SelfSigned/L=SelfSigned/O=SelfSigned/OU=SelfSigned"
fi

echo "Done"
echo "learn more about what the script can do, pass the --help flag"
