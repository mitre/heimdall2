import jsonServer from 'json-server';
import SonarQubeData from './sonarqube.json' with { type: 'json' };
const server = jsonServer.create();
const middlewares = jsonServer.defaults();
// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

server.get('/health', (_request, response) => response.sendStatus(200));

// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
server.use(jsonServer.bodyParser);
server.use((request, response, next) => {
  if (request.originalUrl.startsWith('/login/oauth/authorize')) {
    const callback = new URL(request.query.redirect_uri || '/authn/github/callback', process.env.CYPRESS_BASE_URL || 'http://127.0.0.1:3000');
    callback.searchParams.set('code', '1234');
    if (request.query.state) {
      callback.searchParams.set('state', request.query.state);
    }
    response.redirect(callback.href);
  } else if (request.originalUrl.startsWith('/user/emails')) {
    response.send([
      {
        email: 'example@mitre.org',
        primary: true,
        verified: true,
        visibility: 'private',
      },
      {
        email: '66680985+example@users.noreply.github.com',
        primary: false,
        verified: true,
        visibility: null,
      },
    ]);
  } else if (request.originalUrl.startsWith('/user')) {
    response.send({
      avatar_url: 'https://avatars.githubusercontent.com/u/66680985?v=4',
      bio: null,
      blog: '',
      company: null,
      created_at: '2020-06-09T13:04:43Z',
      email: null,
      events_url: 'https://api.github.com/users/example/events{/privacy}',
      followers: 1,
      followers_url: 'https://api.github.com/users/example/followers',
      following: 0,
      following_url:
        'https://api.github.com/users/example/following{/other_user}',
      gists_url: 'https://api.github.com/users/example/gists{/gist_id}',
      gravatar_id: '',
      hireable: null,
      html_url: 'https://github.com/example',
      id: 66_680_985,
      location: null,
      login: 'example',
      name: 'Example User',
      node_id: '',
      organizations_url: 'https://api.github.com/users/example/orgs',
      public_gists: 1,
      public_repos: 2,
      received_events_url:
        'https://api.github.com/users/example/received_events',
      repos_url: 'https://api.github.com/users/example/repos',
      site_admin: false,
      starred_url:
        'https://api.github.com/users/example/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/example/subscriptions',
      twitter_username: null,
      type: 'User',
      updated_at: '2021-01-03T15:33:05Z',
      url: 'https://api.github.com/users/example',
    });
  } else if (
    request.method === 'POST'
    && request.originalUrl.startsWith('/login/oauth/access_token')
  ) {
    response.send({
      access_token: 'e72e16c7e42f292c6912e7710c838347ae178b4a',
      scope: 'name:user',
      token_type: 'bearer',
    });
  } else if (request.originalUrl.startsWith('/api')) {
    response.send(SonarQubeData[request.originalUrl]);
  } else {
    next();
  }
});

server.listen(3001, () => {
  console.log('OAuth JSON Server is running');
});
