# Heimdall2 Developer Install on Oracle Linux 8 (OL8)

This guide is based on the "For Developers -> How to Install" section in `README.md`, with Oracle Linux 8 specific commands that have been hand tested.

Run commands as a regular user with `sudo` unless noted otherwise.

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

## 2. Install and start PostgreSQL 18

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

If you want to install manually, use the PostgreSQL Red Hat guide: <https://www.postgresql.org/download/linux/redhat/>

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
sudo -u postgres -i
psql postgres
```

In `psql`:

```sql
ALTER SYSTEM SET password_encryption = 'scram-sha-256';
SELECT pg_reload_conf();

CREATE USER <username> with encrypted password '<password>';
ALTER USER <username> CREATEDB;
\q
```

Exit back to your normal shell:

```bash
exit
```

## 5. Troubleshooting: verify password format (optional)

If login fails and you suspect the role password was stored as MD5, run:

```bash
sudo -u postgres -i
psql postgres
```

```sql
SELECT rolname, rolcanlogin, rolpassword FROM pg_authid WHERE rolname='<username>';
\q
```

```bash
exit
```

If `rolpassword` starts with `md5`, set `password_encryption` to `scram-sha-256` (step 4), then reset that user password.

## 6. Install project dependencies and generate backend env file

```bash
yarn install
./setup-dev-env.sh
```

Update `apps/backend/.env`:

```dotenv
DATABASE_USERNAME=<username>
DATABASE_PASSWORD=<password>
NODE_ENV=production
```

## 7. Create, migrate, and seed the database

```bash
yarn backend sequelize-cli db:create
yarn backend sequelize-cli db:migrate
yarn backend sequelize-cli db:seed:all
```

## 8. Start Heimdall (development mode)

```bash
yarn start:dev
```
