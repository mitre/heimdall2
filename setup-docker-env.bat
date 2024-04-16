ECHO OFF
SETLOCAL
Setlocal EnableDelayedExpansion

IF EXIST .env (
	ECHO ".env already exists, if you would like to regenerate your secrets, please delete this file and re-run the script. WARNING: Re-running this script will cause the database password to be reset within the .env file, but the database will still be expecting the old password.  If this happens, you can 1) change DATABASE_PASSWORD in the .env file back to the old password, 2) connect to the database directly and reset the password to the newly generated one, or 3) remove the 'data/' folder (which will delete all data)."
) ELSE (
	ECHO ".env does not exist, creating..."
  CD . > .env
)



REM Set the PostgreSQL db password
FINDSTR /C:"DATABASE_PASSWORD" .env > Nul
IF !ERRORLEVEL! EQU 1 (
  ECHO "DATABASE_PASSWORD" was not found within the .env file, generating secret...
  FOR /F "tokens=* USEBACKQ" %%F IN (`openssl rand -hex 33`) DO (
    ECHO DATABASE_PASSWORD=%%F >> .env
  )
)

REM Set the JWT expire time
SET jwtexpiretime=1d
FINDSTR /C:"JWT_EXPIRE_TIME" .env > Nul
IF !ERRORLEVEL! EQU 1 (
  ECHO "JWT_EXPIRE_TIME" was not found within the .env file, generating secret..."
  CALL :SET_JWT_EXPIRE_TIME
)

REM Generate the JWT SECRET (password)
FINDSTR /C:"JWT_SECRET" .env > Nul
IF !ERRORLEVEL! EQU 1 (
  ECHO "JWT_SECRET" was not found within the .env file, generating secret..."
  FOR /F "tokens=* USEBACKQ" %%F IN (`openssl rand -hex 64`) DO (
    ECHO JWT_SECRET=%%F >> .env
  )
)


REM Enable API keys
FINDSTR /C:"API_KEY_SECRET" .env > Nul
IF !ERRORLEVEL! EQU 1 (
  SET /P enableapikeys="API_KEY_SECRET was not found within the .env file. Enable API keys [Y/n]: "
  ECHO HERE enableapikeys is !enableapikeys!
  IF /I "!enableapikeys!" EQU "Y" (
    FOR /F "tokens=* USEBACKQ" %%F IN (`openssl rand -hex 33`) DO (
      ECHO API_KEY_SECRET=%%F >> .env
    )
  )
)  

REM Set NGINX Host, if required
FINDSTR /C:"NGINX_HOST" .env > Nul
IF %ERRORLEVEL% EQU 1 (
  ECHO "NGINX_HOST" was not found within the .env file, set NGINX_HOST IP...
  CALL :SET_NGINX_HOST
)  

REM Generate the SSL certificates
IF EXIST ./nginx/certs/ssl_certificate.crt (
  ECHO "SSL Certificate already exists. If you would like to regenerate your certificates, please delete the files in ./nginx/certs/ and re-run this script."
) ELSE (
	ECHO "SSL Certificate does not exist, creating self-signed certificate..."
	ECHO Be sure your production environment is configured to work with your self-signed certificate.
	ECHO
	ECHO "Generating certificate (Expires in 7 days)..."
  openssl req -newkey rsa:4096 -x509 -sha256 -days 7 -nodes -out nginx/certs/ssl_certificate.crt -keyout nginx/certs/ssl_certificate_key.key -subj "/C=US/ST=SelfSigned/L=SelfSigned/O=SelfSigned/OU=SelfSigned
  ECHO Certificates were generated 
)


REM Exit the batch process
EXIT /B !ERRORLEVEL!

REM ------------------------------------------------------------------------------------------
REM Supporting function - Note: we use the function input function outside the IF %ERRORLEVEL%
REM because the SET /P does not work as expected inside the IF %ERRORLEVEL% block

:SET_JWT_EXPIRE_TIME
  SET /P jwtexpiretime="Enter JWT_EXPIRE_TIME ex. 1d or 25m (leave blank to use default [!jwtexpiretime!]): "
  ECHO JWT_EXPIRE_TIME=!%jwtexpiretime! >> .env
EXIT /B 0

:SET_NGINX_HOST
  SET nginxhost=127.0.0.1
  SET /P nginxhost="Enter your FQDN/Hostname/IP Address (leave blank to use default [%nginxhost%]): "
  ECHO NGINX_HOST=%nginxhost% >> .env
EXIT /B 0