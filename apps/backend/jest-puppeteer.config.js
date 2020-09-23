require('dotenv').config();

function headless() {
  const input = process.env.HEIMDALL_HEADLESS_TESTS;
  if(typeof input !== 'undefined' && input) {
    return input == 'true';
  } else {
    return true;
  }
}

module.exports = {
  launch: {
    dumpio: true,
    headless: headless(),
    args: [
      '--disable-infobars',
      '--disable-gpu',
      '--hide-scrollbars',
      '--mute-audio',
      '--disable-dev-shm-usage',
      '--no-sandbox'
    ],
    defaultViewport: {
      height: 1080,
      width: 1920
    }
  },
  server: {
    command: 'npm run start',
    port: process.env.PORT || 3000,
    launchTimeout: 20000
  }
};
