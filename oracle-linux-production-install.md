# Heimdall2 Production Install on Oracle Linux

## 1. Set up system dependencies

```bash
sudo dnf -y update

curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -

sudo dnf install -y nodejs git
sudo npm install -g yarn
```

Optional version checks:

```bash
node --version
npm --version
yarn --version
```

## 2. Install and start PostgreSQL

The repository RPM filename is `noarch`, but the URL directory is architecture-specific (for example `x86_64` or `aarch64`).
Detect your architecture and use it in the repo URL:

```bash
ARCH="$(uname -m)"
sudo dnf install -y "https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-${ARCH}/pgdg-redhat-repo-latest.noarch.rpm"
sudo dnf -qy module disable postgresql
sudo dnf install -y postgresql18 postgresql18-server
sudo /usr/pgsql-18/bin/postgresql-18-setup initdb
sudo systemctl enable postgresql-18
sudo systemctl start postgresql-18
```

If you want to use another version, follow the PostgreSQL Red Hat guide: <https://www.postgresql.org/download/linux/redhat/>

PostgreSQL version must be greater than 10:

```bash
psql --version
```

## 3. Clone Heimdall2

```bash
git clone https://github.com/mitre/heimdall2
cd heimdall2
```

## 4. Configure PostgreSQL authentication and database user

```bash
# Switch to the OS postgres user
sudo -u postgres -i
# Start the Postgres terminal
psql postgres
```

In `psql` terminal:

```sql
# Create the database user
CREATE USER <username> with encrypted password '<password>';
ALTER USER <username> CREATEDB;
\q

# Switch back to your original OS user
exit
```

## 5. Install project dependencies and generate backend env file

Make sure that these commands are executed in the root directory of the repository:

```bash
yarn install
./setup-dev-env.sh
```

Make sure to set the DATABASE_USERNAME and DATABASE_PASSWORD fields with the values you set for PostgresDB in the previous step.

Then manually update `apps/backend/.env` to set `NODE_ENV=production`

```dotenv
NODE_ENV=production
DATABASE_USERNAME=<username>
DATABASE_PASSWORD=<password>
NGINX_HOST=<fqdn-or-hostname>
```

For more info on configuration values see [Enviroment Variables Configuration](https://github.com/mitre/heimdall2/wiki/Environment-Variables-Configuration).

> [!NOTE]
> The .env file in the root repository is for the Docker deployment of the Heimdall application. Running a local build will use the .env file in the `apps/backend` directory for the database configurations.

## 6. Create, migrate, and seed the database

```bash
yarn backend sequelize-cli db:create
yarn backend sequelize-cli db:migrate
yarn backend sequelize-cli db:seed:all
```

## 7. Build and start Heimdall in production

```bash
yarn build
yarn start
```

## 8. Troubleshooting: verify password format (optional)

If PostgreSQL database creation fails, or login is unsuccessful, follow this sequence.

1. Check how PostgreSQL stored the role password.

    ```bash
    sudo -u postgres psql postgres -c "SELECT rolname, rolcanlogin, rolpassword FROM pg_authid WHERE rolname='<username>';"
    ```

2. If `rolpassword` does not start with `SCRAM-SHA-256`, reconfigure encryption and reset the user password.

    ```bash
    sudo -u postgres psql postgres -c "ALTER SYSTEM SET password_encryption = 'scram-sha-256';"
    sudo -u postgres psql postgres -c "SELECT pg_reload_conf();"
    sudo -u postgres psql postgres -c "ALTER USER <username> WITH ENCRYPTED PASSWORD '<password>';"
    ```

3. Verify local host authentication is using SCRAM in `pg_hba.conf`.
Run this from your original OS user shell:

    ```bash
    sudo vi "$(sudo -u postgres psql -tAc "show hba_file;")"
    ```

    That command opens the active `pg_hba.conf` path returned by PostgreSQL.
    Scroll to the bottom find the loopback host rules and make sure they are exactly:

    ```conf
    # IPv4 local connections:
    host    all             all             127.0.0.1/32            scram-sha-256
    # IPv6 local connections:
    host    all             all             ::1/128                 scram-sha-256
    ```

    Then reload PostgreSQL:

    ```bash
    sudo systemctl reload postgresql-18
    ```
