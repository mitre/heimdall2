(async () => {
  const {OAuth2Server} = require('oauth2-mock-server');
  const server = new OAuth2Server();

  // Generate a new RSA key and add it to the keystore
  await server.issuer.keys.generateRSA();

  // Start the server
  await server.start(8082, 'localhost');
  server.service.on('beforeUserinfo', (userInfoResponse, req) => {
    userInfoResponse.body = {
      email: 'example@example.com',
      email_verified: true,
      name: 'Example User',
      given_name: 'Example',
      family_name: 'User'
    };
  });
  console.log(`Started OpenID Connect mock server at: ${server.issuer.url}`);
})();
