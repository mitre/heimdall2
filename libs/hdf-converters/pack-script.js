const fs = require('fs')

fs.copyFileSync('package.json', 'package.json.orig')

const input = JSON.parse(fs.readFileSync('package.json', 'utf8'))

input.main = 'lib/index.js'

fs.writeFileSync('package.json', JSON.stringify(input, null, 2))
