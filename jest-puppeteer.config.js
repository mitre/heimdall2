require('dotenv').config();
const port  = process.env.HEIMDALL_SERVER_PORT
process.env.APP_URL = 'http://localhost:'+port

module.exports = {
  launch: {
    dumpio: true,
    headless: true,
    args: ["--disable-infobars"],
    defaultViewport: null
  },
  server: {
    command: 'npm run start',
    port: process.env.HEIMDALL_SERVER_PORT, 
    launchTimeout: 20000,

  }
};
