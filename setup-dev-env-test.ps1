
# Constants
$ENV_PATH = "apps\backend\.env"

# Functions
function Read-Input {
    param (
        [string]$prompt,
        [string]$default
    )
    $input = Read-Host -Prompt $prompt
    if ($input -eq "") { $input = $default }
    return $input
}

function Add-To-Env {
    param (
        [string]$key,
        [string]$value
    )
    Add-Content -Path $ENV_PATH -Value "$key=$value"
}

function Generate-Key {
    param (
        [int]$length
    )
    return -join ((65..90) + (97..122) | Get-Random -Count $length | % {[char]$_})
}

# Main script
if (!(Test-Path -Path $ENV_PATH)) {
    Write-Host ".env does not exist, creating..."
    Set-Location . | Out-File -FilePath $ENV_PATH
}

$dbusername = Read-Input "Enter the username for the PostgreSQL database" "postgres"
Add-To-Env "DATABASE_USERNAME" $dbusername

$dbpassword = Read-Input "Enter the password for the PostgreSQL database" ""
if ($dbpassword -ne "") {
    Add-To-Env "DATABASE_PASSWORD" $dbpassword
}

$jwtexpiretime = Read-Input "Enter the JWT expire time (e.g., 1d or 25m)" "1d"
Add-To-Env "JWT_EXPIRE_TIME" $jwtexpiretime

$jwtsecret = Generate-Key -length 64
Add-To-Env "JWT_SECRET" $jwtsecret

$enableapikeys = Read-Input "Enable API keys (API_KEY_SECRET) [Y/n]" "n"
if ($enableapikeys -eq "Y") {
    $apikey = Generate-Key -length 33
    Add-To-Env "API_KEY_SECRET" $apikey
}

$nginxhost = Read-Input "Enter your FQDN/Hostname/IP Address" "127.0.0.1"
Add-To-Env "NGINX_HOST" $nginxhost

# Constants
$ENV_PATH = "apps\backend\.env"

# Functions
function Read-Input {
    param (
        [string]$prompt,
        [string]$default
    )
    $input = Read-Host -Prompt $prompt
    if ($input -eq "") { $input = $default }
    return $input
}

function Add-To-Env {
    param (
        [string]$key,
        [string]$value
    )
    Add-Content -Path $ENV_PATH -Value "$key=$value"
}

function Generate-Key {
    param (
        [int]$length
    )
    return -join ((65..90) + (97..122) | Get-Random -Count $length | % {[char]$_})
}

# Main script
if (!(Test-Path -Path $ENV_PATH)) {
    Write-Host ".env does not exist, creating..."
    Set-Location . | Out-File -FilePath $ENV_PATH
}

$dbusername = Read-Input "Enter the username for the PostgreSQL database" "postgres"
Add-To-Env "DATABASE_USERNAME" $dbusername

$dbpassword = Read-Input "Enter the password for the PostgreSQL database" ""
if ($dbpassword -ne "") {
    Add-To-Env "DATABASE_PASSWORD" $dbpassword
}

$jwtexpiretime = Read-Input "Enter the JWT expire time (e.g., 1d or 25m)" "1d"
Add-To-Env "JWT_EXPIRE_TIME" $jwtexpiretime

$jwtsecret = Generate-Key -length 64
Add-To-Env "JWT_SECRET" $jwtsecret

$enableapikeys = Read-Input "Enable API keys (API_KEY_SECRET) [Y/n]" "n"
if ($enableapikeys -eq "Y") {
    $apikey = Generate-Key -length 33
    Add-To-Env "API_KEY_SECRET" $apikey
}

$nginxhost = Read-Input "Enter your FQDN/Hostname/IP Address" "127.0.0.1"
Add-To-Env "NGINX_HOST" $nginxhost

# Check if .env file exists
if (Test-Path -Path "apps\backend\.env") {
    Write-Host ".env already exists, so all unset environment variables will now be filled by default values. If you would like to completely regenerate your secrets, please delete this file and then re-run the script."
} else {
    Write-Host ".env does not exist, creating..."
    Set-Location . | Out-File -FilePath "apps\backend\.env"
}

# Set the environment to development mode
if (!(Select-String -Path "apps\backend\.env" -Pattern "NODE_ENV")) {
    Write-Host "NODE_ENV was not found within the .env file!"
    Add-Content -Path "apps\backend\.env" -Value "NODE_ENV=development"
}

# Get the PostgreSQL db user name
$dbusername = "postgres"
if (!(Select-String -Path "apps\backend\.env" -Pattern "DATABASE_USERNAME")) {
    Write-Host "DATABASE_USERNAME was not found within the .env file!"
    $dbusername = Read-Host -Prompt "Enter DATABASE_USERNAME (leave blank to use default [$dbusername])"
    if ($dbusername -eq "") { $dbusername = "postgres" }
    Add-Content -Path "apps\backend\.env" -Value "DATABASE_USERNAME=$dbusername"
}

# Get the PostgreSQL db password
$dbpassword = Read-Host -Prompt "Enter DATABASE_PASSWORD (leave blank to not set a password)"
if ($dbpassword -ne "") {
    Add-Content -Path "apps\backend\.env" -Value "DATABASE_PASSWORD=$dbpassword"
}

# Set the JWT expire time
$jwtexpiretime = "1d"
if (!(Select-String -Path "apps\backend\.env" -Pattern "JWT_EXPIRE_TIME")) {
    Write-Host "JWT_EXPIRE_TIME was not found within the .env file!"
    $jwtexpiretime = Read-Host -Prompt "Enter JWT_EXPIRE_TIME ex. 1d or 25m (leave blank to use default [$jwtexpiretime])"
    if ($jwtexpiretime -eq "") { $jwtexpiretime = "1d" }
    Add-Content -Path "apps\backend\.env" -Value "JWT_EXPIRE_TIME=$jwtexpiretime"
}

# Generate the JWT SECRET (password)
if (!(Select-String -Path "apps\backend\.env" -Pattern "JWT_SECRET")) {
    Write-Host "JWT_SECRET was not found within the .env file!"
    $jwtsecret = -join ((65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
    Add-Content -Path "apps\backend\.env" -Value "JWT_SECRET=$jwtsecret"
}

# Enable API keys
$enableapikeys = Read-Host -Prompt "Enable API keys (API_KEY_SECRET) [Y/n]"
if ($enableapikeys -eq "Y") {
    $apikey = -join ((65..90) + (97..122) | Get-Random -Count 33 | % {[char]$_})
    Add-Content -Path "apps\backend\.env" -Value "API_KEY_SECRET=$apikey"
}

# Set NGINX_HOST
$nginxhost = "127.0.0.1"
if (!(Select-String -Path "apps\backend\.env" -Pattern "NGINX_HOST")) {
    Write-Host ".env does not contain NGINX_HOST..."
    $nginxhost = Read-Host -Prompt "Enter your FQDN/Hostname/IP Address (leave blank to use default [$nginxhost])"
    if ($nginxhost -eq "") { $nginxhost = "127.0.0.1" }
    Add-Content -Path "apps\backend\.env" -Value "NGINX_HOST=$nginxhost"
}


# Supporting function to generate a key
function Generate-Key {
    param (
        [int]$length
    )
    return -join ((65..90) + (97..122) | Get-Random -Count $length | % {[char]$_})
}

# Set the PostgreSQL db user name
$dbusername = "postgres"
$dbusername = Read-Host -Prompt "Enter DATABASE_USERNAME (leave blank to use default [$dbusername])"
if ($dbusername -eq "") { $dbusername = "postgres" }
Add-Content -Path "apps\backend\.env" -Value "DATABASE_USERNAME=$dbusername"

# Set the PostgreSQL db password
$dbpassword = Read-Host -Prompt "Enter DATABASE_PASSWORD (leave blank to not set a password)"
if ($dbpassword -ne "") {
    Add-Content -Path "apps\backend\.env" -Value "DATABASE_PASSWORD=$dbpassword"
}

# Set the JWT expire time
$jwtexpiretime = "1d"
$jwtexpiretime = Read-Host -Prompt "Enter JWT_EXPIRE_TIME ex. 1d or 25m (leave blank to use default [$jwtexpiretime])"
if ($jwtexpiretime -eq "") { $jwtexpiretime = "1d" }
Add-Content -Path "apps\backend\.env" -Value "JWT_EXPIRE_TIME=$jwtexpiretime"

# Generate the JWT SECRET (password)
$jwtsecret = Generate-Key -length 64
Add-Content -Path "apps\backend\.env" -Value "JWT_SECRET=$jwtsecret"

# Enable API keys
$enableapikeys = Read-Host -Prompt "Enable API keys (API_KEY_SECRET) [Y/n]"
if ($enableapikeys -eq "Y") {
    $apikey = Generate-Key -length 33
    Add-Content -Path "apps\backend\.env" -Value "API_KEY_SECRET=$apikey"
}

# Set NGINX_HOST
$nginxhost = "127.0.0.1"
$nginxhost = Read-Host -Prompt "Enter your FQDN/Hostname/IP Address (leave blank to use default [$nginxhost])"
if ($nginxhost -eq "") { $nginxhost = "127.0.0.1" }
Add-Content -Path "apps\backend\.env" -Value "NGINX_HOST=$nginxhost"

# Generate the SSL certificates
if (!(Test-Path -Path "./nginx/certs/ssl_certificate.crt")) {
    Write-Host "SSL Certificate does not exist, creating self-signed certificate..."
    Write-Host "Be sure your production environment is configured to work with your self-signed certificate."
    Write-Host "Generating certificate (Expires in 7 days)..."
    openssl req -newkey rsa:4096 -x509 -sha256 -days 7 -nodes -out nginx/certs/ssl_certificate.crt -keyout nginx/certs/ssl_certificate_key.key -subj "/C=US/ST=SelfSigned/L=SelfSigned/O=SelfSigned/OU=SelfSigned/CN=SelfSigned"
    Write-Host "Certificates were generated"
} else {
    Write-Host "SSL Certificate already exists. If you would like to regenerate your certificates, please delete the files in ./nginx/certs/ and re-run this script."
}