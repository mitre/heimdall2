const fs = require('fs')

const packageFile = 'package.json'
fs.copyFileSync(packageFile, `${packageFile}.orig`)

const input = JSON.parse(fs.readFileSync(packageFile, 'utf8'))

input.exports['.'] = './lib/index.js'
input.exports['./interfaces'] = './lib/interfaces/index.js'
input.exports['./crypto'] = './lib/crypto/index.js'

fs.writeFileSync(packageFile, JSON.stringify(input, null, 2))
