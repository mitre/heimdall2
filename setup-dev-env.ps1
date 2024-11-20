# Define the path to the .env file
$ENV_PATH = "apps\backend\.env"

# Function to read input from the user with a default value
function Read-Input {
    param (
        [string]$prompt,  # The prompt to display to the user
        [string]$default  # The default value to use if the user doesn't enter anything
    )
    # Read the input from the user
    $input = Read-Host -Prompt $prompt
    # If the user didn't enter anything, use the default value
    if ($input -eq "") { $input = $default }
    # Return the input
    return $input
}

# Function to add a key-value pair to the .env file
function Add-To-Env {
    param (
        [string]$key,    # The key to add
        [string]$value   # The value to add
    )
    # Add the key-value pair to the .env file
    Add-Content -Path $ENV_PATH -Value "$key=$value"
}

# Function to generate a random key of a specified length
function Generate-Key {
    param (
        [int]$length  # The length of the key to generate
    )
    # Generate the key and return it
    return -join ((65..90) + (97..122) | Get-Random -Count $length | % {[char]$_})
}

# Check if the .env file exists, and create it if it doesn't
if (!(Test-Path -Path $ENV_PATH)) {
    Write-Host ".env does not exist, creating..."
    New-Item -Path $ENV_PATH -ItemType File | Out-Null
}

# Set the NODE_ENV environment variable to development
Add-To-Env "NODE_ENV" "development"

# Prompt the user for the PostgreSQL database username and password, and set the corresponding environment variables
$dbusername = Read-Input "Enter the username for the PostgreSQL database" "postgres"
Add-To-Env "DATABASE_USERNAME" $dbusername

$dbpassword = Read-Input "Enter the password for the PostgreSQL database" ""
if ($dbpassword -ne "") {
    Add-To-Env "DATABASE_PASSWORD" $dbpassword
}

# Prompt the user for the JWT expire time, and set the corresponding environment variable
$jwtexpiretime = Read-Input "Enter the JWT expire time (e.g., 1d or 25m)" "1d"
Add-To-Env "JWT_EXPIRE_TIME" $jwtexpiretime

# Generate a JWT secret and set the corresponding environment variable
$jwtsecret = Generate-Key -length 64
Add-To-Env "JWT_SECRET" $jwtsecret

# Prompt the user to enable API keys, and if enabled, generate an API key and set the corresponding environment variable
$enableapikeys = Read-Input "Enable API keys (API_KEY_SECRET) [Y/n]" "n"
if ($enableapikeys -eq "Y") {
    $apikey = Generate-Key -length 33
    Add-To-Env "API_KEY_SECRET" $apikey
}

# Prompt the user for the FQDN/Hostname/IP Address, and set the corresponding environment variable
$nginxhost = Read-Input "Enter your FQDN/Hostname/IP Address" "127.0.0.1"
Add-To-Env "NGINX_HOST" $nginxhost

# Check if the SSL certificate exists, and if it doesn't, generate a new self-signed certificate
if (!(Test-Path -Path "./nginx/certs/ssl_certificate.crt")) {
    Write-Host "SSL Certificate does not exist, creating self-signed certificate..."
    Write-Host "Be sure your production environment is configured to work with your self-signed certificate."
    Write-Host "Generating certificate (Expires in 7 days)..."
    openssl req -newkey rsa:4096 -x509 -sha256 -days 7 -nodes -out nginx/certs/ssl_certificate.crt -keyout nginx/certs/ssl_certificate_key.key -subj "/C=US/ST=SelfSigned/L=SelfSigned/O=SelfSigned/OU=SelfSigned/CN=SelfSigned"
    Write-Host "Certificates were generated"
} else {
    Write-Host "SSL Certificate already exists. If you would like to regenerate your certificates, please delete the files in ./nginx/certs/ and re-run this script."
}