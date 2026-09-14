import { OAuth2Server } from 'oauth2-mock-server';
const server = new OAuth2Server();
await server.issuer.keys.generate('RS256');

const profile = { emailVerified: true };
server.service.addRoute('POST', '/__test__/profile', (request, response) => {
  if (typeof request.body?.emailVerified !== 'boolean') {
    response.writeHead(400, { 'Content-Type': 'text/plain' });
    response.end('emailVerified must be a boolean');
    return;
  }
  profile.emailVerified = request.body.emailVerified;
  response.writeHead(204);
  response.end();
});
server.service.on('beforeUserinfo', (response) => {
  response.body = {
    email: 'example@example.com',
    email_verified: profile.emailVerified,
    family_name: 'User',
    given_name: 'Example',
    name: 'Example User',
    sub: 'example-user',
  };
});

await server.start(8082, 'localhost');
console.log(`Started OpenID Connect mock server at: ${server.issuer.url}`);
