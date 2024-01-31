#!/usr/bin/env node

/** Simple script that hosts index.html
 * Not particularly robust, but facilitates running via npx.
 *
 * Can specify port using the first command line argument.
 */

// Node internals
const process = require('process');
const path = require('path');
const express = require('express');

// Figure out port number
let port = 8000;
if (process.argv.length > 2) {
  port = Number.parseInt(process.argv[2]);
  if (Number.isNaN(port) || port < 1 || port >= 65536) {
    // eslint-disable-next-line no-console
    console.error(`Error: ${process.argv[2]} is not a valid port.`);
    return;
  }
}

// eslint-disable-next-line no-console
console.log(`Serving Heimdall on port ${port}`);

express()
  .use(express.static(path.join(__dirname, '../dist')))
  .listen(port);
