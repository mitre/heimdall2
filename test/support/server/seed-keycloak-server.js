(async () => {
  const filePath = process.argv.slice(2)[0];
  const KcAdminClient = require('keycloak-admin').default;
  const fs = require('fs');

  // By default expects keycloak to run on localhost:8080
  const kcAdminClient = new KcAdminClient({
    baseUrl: 'http://127.0.0.1:8081/auth'
  });

  await kcAdminClient.auth({
    username: 'admin',
    password: 'admin',
    grantType: 'password',
    clientId: 'admin-cli'
  });

  await kcAdminClient.users.create({
    username: 'Example User',
    email: 'example@example.com',
    firstName: 'Example',
    lastName: 'User',
    credentials: [{
      temporary: false,
      type: 'password',
      value: 'test',
    }],
    // enabled required to be true in order to send actions email
    emailVerified: true,
    enabled: true,
  });

  // const temp = await kcAdminClient.clients.find({id: 'Heimdall'});
  // console.log(temp);

  const client = await kcAdminClient.clients.create({
    clientId: 'Heimdall',
    protocol: 'openid-connect',
    clientAuthenticatorType: 'client-secret',
    redirectUris: ['http://127.0.0.1:3000/authn/oidc/callback'],
    publicClient: false
  });

  const newCredential = await kcAdminClient.clients.generateNewClientSecret({
    id: client.id
  });

  fs.appendFile(filePath, `\nOIDC_CLIENT_SECRET=${newCredential.value}`, function (err) {
    if (err) throw err;
    console.log(`Saved OIDC_CLIENT_SECRET`);
  });
})();
