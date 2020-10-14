#!/usr/bin/env node

/** Simple script that hosts index.html
 * Not particularly robust, but facillitates running via npx.
 *
 * Can specify port using the first command line argument.
 */

// Node internals
const process = require('process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const connect = require('connect');

// Initialize
const app = connect();
var port = 8000;
if (process.argv.length > 2) {
  port = Number.parseInt(process.argv[2]);
  if (Number.isNaN(port) || port < 1 || port >= 65536) {
    console.error('Error: ' + process.argv[2] + ' is not a valid port.');
    return;
  }
}

// Get index
var txt = fs.readFileSync(path.join(__dirname, '../dist/index.html'));

// respond to all requests with index.html
app.use(function (req, res) {
  res.end(txt);
});

//create node.js http server and listen on port
http.createServer(app).listen(port);
