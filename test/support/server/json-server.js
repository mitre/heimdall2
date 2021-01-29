const jsonServer = require('json-server');
const server = jsonServer.create();
const middlewares = jsonServer.defaults();

// Set default middlewares (logger, static, cors and no-cache)
server.use(middlewares);

// Add custom routes before JSON Server router
server.get('/echo', (req, res) => {
  res.jsonp(req.query);
});

// To handle POST, PUT and PATCH you need to use a body-parser
// You can use the one used by JSON Server
server.use(jsonServer.bodyParser);
server.use((req, res, next) => {
  if (req.originalUrl.startsWith('/authorize')) {
    res.redirect('http://127.0.0.1:3000/authn/github/callback?code=1234');
  } else if (req.originalUrl.startsWith('/user')) {
    res.send({
      login: 'example',
      id: 66680985,
      node_id: '',
      avatar_url: 'https://avatars.githubusercontent.com/u/66680985?v=4',
      gravatar_id: '',
      url: 'https://api.github.com/users/example',
      html_url: 'https://github.com/example',
      followers_url: 'https://api.github.com/users/example/followers',
      following_url:
        'https://api.github.com/users/example/following{/other_user}',
      gists_url: 'https://api.github.com/users/example/gists{/gist_id}',
      starred_url:
        'https://api.github.com/users/example/starred{/owner}{/repo}',
      subscriptions_url: 'https://api.github.com/users/example/subscriptions',
      organizations_url: 'https://api.github.com/users/example/orgs',
      repos_url: 'https://api.github.com/users/example/repos',
      events_url: 'https://api.github.com/users/example/events{/privacy}',
      received_events_url:
        'https://api.github.com/users/example/received_events',
      type: 'User',
      site_admin: false,
      name: 'Example User',
      company: null,
      blog: '',
      location: null,
      email: null,
      hireable: null,
      bio: null,
      twitter_username: null,
      public_repos: 2,
      public_gists: 1,
      followers: 1,
      following: 0,
      created_at: '2020-06-09T13:04:43Z',
      updated_at: '2021-01-03T15:33:05Z'
    });
  } else if (req.originalUrl.startsWith('/emails')) {
    res.send([
      {
        email: 'example@mitre.org',
        primary: true,
        verified: true,
        visibility: 'private'
      },
      {
        email: '66680985+example@users.noreply.github.com',
        primary: false,
        verified: true,
        visibility: null
      }
    ]);
  } else if (
    req.method === 'POST' &&
    req.originalUrl.startsWith('/access_token')
  ) {
    res.send({
      access_token: 'e72e16c7e42f292c6912e7710c838347ae178b4a',
      scope: 'name:user',
      token_type: 'bearer'
    });
  } else {
    console.log('hit');
    next();
  }
});

server.listen(3001, () => {
  console.log('OAuth JSON Server is running');
});
