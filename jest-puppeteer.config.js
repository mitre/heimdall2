require('dotenv').config();

module.exports = {
  launch: {
    dumpio: true,
    headless: true,
    args: ['--disable-infobars'],
    defaultViewport: null
  },
  server: {
    command: 'npm run start',
    port: process.env.HEIMDALL_SERVER_PORT || 3000,
    launchTimeout: 20000
  }
};
