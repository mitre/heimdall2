ECHO OFF
SETLOCAL

IF EXIST apps\backend\.env (
	ECHO ".env already exists, so all unset environment variables will now be filled by default values. If you would like to completely regenerate your secrets, please delete this file and then re-run the script."
) ELSE (
	ECHO ".env does not exist, creating..."
  CD . > apps\backend\.env
)

REM Set the environment to development mode
FINDSTR /C:"NODE_ENV" apps\backend\.env > Nul
IF %ERRORLEVEL% EQU 1 (
  ECHO "NODE_ENV" was not found within the .env file!
  ECHO NODE_ENV=development >> apps\backend\.env
)

REM Get the PostgreSQL db user name
SET dbusername=postgres
FINDSTR /C:"DATABASE_USERNAME" apps\backend\.env > Nul
IF %ERRORLEVEL% EQU 1 (
  ECHO "DATABASE_USERNAME" was not found within the .env file!
  CALL :SET_DB_USER_NAME
)

REM Get the PostgreSQL db password
FINDSTR /C:"DATABASE_PASSWORD" apps\backend\.env > Nul
IF %ERRORLEVEL% EQU 1 (
  ECHO "DATABASE_PASSWORD" was not found within the .env file!
  CALL :SET_DB_PASSWORD
)

REM Set the JWT expire time
SET jwtexpiretime=1d
FINDSTR /C:"JWT_EXPIRE_TIME" apps\backend\.env > Nul
IF %ERRORLEVEL% EQU 1 (
  ECHO "JWT_EXPIRE_TIME" was not found within the .env file!
  CALL :SET_JWT_EXPIRE_TIME
)

REM Generate the JWT SECRET (password)
FINDSTR /C:"JWT_SECRET" apps\backend\.env > Nul
IF %ERRORLEVEL% EQU 1 (
  ECHO "JWT_SECRET" was not found within the .env file!
  CALL :SET_JWT_SECRET
)

REM Enable API keys
FINDSTR /C:"API_KEY_SECRET" apps\backend\.env > Nul
IF %ERRORLEVEL% EQU 1 (
  CALL :SET_API_KEY_SECRET
)  

REM Enable API keys
FINDSTR /C:"NGINX_HOST" apps\backend\.env > Nul
IF %ERRORLEVEL% EQU 1 (
  ECHO ".env does not contain NGINX_HOST..."
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
EXIT /B %ERRORLEVEL%

REM ------------------------------------------------------------------------------------------
REM Supporting function - Note: we use the function input function outside the IF %ERRORLEVEL%
REM because the SET /P does not work as expected inside the IF %ERRORLEVEL% block
:SET_DB_USER_NAME
  SET /P dbusername="Enter DATABASE_USERNAME (leave blank to use default [%dbusername%]): "
  ECHO DATABASE_USERNAME=%dbusername% >> apps/backend/.env
EXIT /B 0

:SET_DB_PASSWORD
  SET /P dbpassword="Enter DATABASE_PASSWORD (leave blank to not set a password): "
  ECHO DATABASE_PASSWORD=%dbpassword% >> apps/backend/.env
EXIT /B 0

:SET_JWT_EXPIRE_TIME
  SET /P jwtexpiretime="Enter JWT_EXPIRE_TIME ex. 1d or 25m (leave blank to use default [%jwtexpiretime%]): "
  ECHO JWT_EXPIRE_TIME=%jwtexpiretime% >> apps/backend/.env
EXIT /B 0

:SET_JWT_SECRET
  CALL :GENERATE_KEY 64, jwtsecret
  ECHO JWT_SECRET=%jwtsecret% >> apps/backend/.env
EXIT /B 0


:SET_API_KEY_SECRET
  SET /P enableapikeys="Enable API keys (API_KEY_SECRET) [Y/n]: "
  IF /I "%enableapikeys%" EQU "Y" (
    CALL :GET_API_KEY_SECRET
  )
EXIT /B 0

:GET_API_KEY_SECRET
  CALL :GENERATE_KEY 33, apikey
  ECHO API_KEY_SECRET=%apikey% >> apps/backend/.env
EXIT /B 0

:GENERATE_KEY
  FOR /F "tokens=* USEBACKQ" %%F IN (`openssl rand -hex %~1`) DO (
    SET "%~2=%%F"
  )
EXIT /B 0

:SET_NGINX_HOST
  SET nginxhost=127.0.0.1
  SET /P nginxhost="Enter your FQDN/Hostname/IP Address (leave blank to use default [%nginxhost%]): "
  ECHO NGINX_HOST=%nginxhost% >> apps/backend/.env
EXIT /B 0
