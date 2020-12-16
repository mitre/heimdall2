## Deploy to Cloud.gov

```bash
$ git clone $REPO
$ cd $REPO
$ git checkout -b some-test-branch
```
**Install Node/NPM**
Check to see what version of Node is being used in the `package.json` file under `engines`. [Nodejs Release Schedule](https://nodejs.org/en/about/releases/). As of writing this [v14 LTS Dubnium](https://nodejs.org/download/release/latest-fermium)

Suggest using [NVM](https://github.com/nvm-sh/nvm) or [NPX](https://github.com/npm/npx)

**Install yarn and build app**
```bash
$ npm install -g yarn
$ yarn install
$ yarn run build
```

**Setup a cloud.gov account, follow instructions to install the cf-cli, and login on the command line:**
* https://cloud.gov/docs/getting-started/accounts/
* https://cloud.gov/docs/getting-started/setup/

```bash
cf login -a api.fr.cloud.gov  --sso
```
* Copy and Paste the [Temporary Authentication Code](https://login.fr.cloud.gov/passcode) when prompted
* Setup a demo application `space`
* Create a small shared postgresql database for testing
* Update manifest.yml file to rename `applications: - name:`

```bash
$ cf target -o sandbox-gsa create-space $REPLACE_PROJECT
$ cf marketplace
$ cf create-service aws-rds shared-psql $REPLACE_DB
$ cf create-service-key $REPLACE_DB $REPLACE_DB_KEY
# Update `manifest.yml` file in the root directory of the project with the values you created ^ to match up.
$ cf push
```