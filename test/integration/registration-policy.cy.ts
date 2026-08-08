import { LDAP_AUTHENTICATION } from '../../apps/backend/test/constants/users-test.constant';

const NOT_PROVISIONED_RESPONSE = {
  error: 'account_not_provisioned',
  message:
    'No Heimdall account exists for this SSO user. Please ask your system administrator to create the account.',
  statusCode: 401,
};

const USER_COUNT_COMMAND
  = 'yarn workspace heimdall-server node -e "const {Client}=require(\'pg\');'
    + 'const client=new Client({database:process.env.DATABASE_NAME??\'heimdallts_testing_service_db\',host:process.env.DATABASE_HOST??\'localhost\',password:process.env.DATABASE_PASSWORD??\'postgres\',port:Number(process.env.DATABASE_PORT??5432),user:process.env.DATABASE_USERNAME??\'postgres\'});'
    + String.raw`(async()=>{await client.connect();const result=await client.query('SELECT COUNT(*)::int AS count FROM \"Users\"');`
    + 'console.log(\'USER_COUNT=\'+result.rows[0].count);await client.end();})().catch(error=>{console.error(error);process.exitCode=1;});"';

const USER_COUNT_MARKER = 'USER_COUNT=';

const parseUserCount = (stdout: string): number => {
  const countLine = stdout
    .split('\n')
    .find(line => line.startsWith(USER_COUNT_MARKER));
  if (countLine === undefined) {
    throw new Error(`Database command did not report a user count: ${stdout}`);
  }
  const count = Number(countLine.slice(USER_COUNT_MARKER.length));
  if (!Number.isSafeInteger(count)) {
    throw new TypeError(`Database reported an invalid user count: ${countLine}`);
  }
  return count;
};

context('External registration policy', () => {
  it('rejects valid LDAP credentials without creating a user when SSO provisioning is disabled', () => {
    let usersBefore: number;

    cy.exec(USER_COUNT_COMMAND).its('stdout').should((stdout) => {
      usersBefore = parseUserCount(stdout);
    });

    cy.request({
      body: LDAP_AUTHENTICATION,
      failOnStatusCode: false,
      method: 'POST',
      url: '/authn/login/ldap',
    }).should((response) => {
      expect(response.status).to.equal(401);
      expect(response.body).to.deep.equal(NOT_PROVISIONED_RESPONSE);
    });

    cy.exec(USER_COUNT_COMMAND).its('stdout').should((stdout) => {
      expect(parseUserCount(stdout)).to.equal(usersBefore);
    });
  });
});
