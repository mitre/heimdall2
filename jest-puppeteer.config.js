require('dotenv').config();

module.exports = {
  launch: {
    dumpio: true,
    headless: true,
    args: [
      '--disable-infobars',
      '--disable-gpu',
      '--hide-scrollbars',
      '--mute-audio'
    ],
    defaultViewport: {
      height: 1080,
      width: 1920
    }
  },
  server: {
    command: 'npm run start',
    port: process.env.HEIMDALL_SERVER_PORT || 3000,
    launchTimeout: 20000
  }
};
