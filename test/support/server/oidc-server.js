(async () => {
  const {OAuth2Server} = require('oauth2-mock-server');
  const server = new OAuth2Server();

  // Generate a new RSA key and add it to the keystore
  await server.issuer.keys.generate("RS256");


  // First test attempt is against a verified email, and the second will be against an unverified email
  let isVerified = true;

  // Start the server
  await server.start(8082, 'localhost');
  server.service.on('beforeUserinfo', (userInfoResponse, req) => {
    userInfoResponse.body = {
      email: 'example@example.com',
      email_verified: isVerified,
      name: 'Example User',
      given_name: 'Example',
      family_name: 'User'
    };

    isVerified = false;
  });

  console.log(`Started OpenID Connect mock server at: ${server.issuer.url}`);
})();
