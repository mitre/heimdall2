import {http, HttpResponse} from 'msw';

export const splunkHandlers = [
  http.post('http://127.0.0.1:8089/services/auth/login', () => {
    return HttpResponse.json({sessionKey: 'mock-session-key-12345'});
  }),

  http.get('http://127.0.0.1:8089/services/data/indexes', () => {
    return HttpResponse.json({
      entry: [
        {name: 'main', content: {totalEventCount: '100'}},
      ],
    });
  }),

  http.post('http://127.0.0.1:8089/services/receivers/simple', () => {
    return HttpResponse.json({text: 'Success', code: 0});
  }),
];
