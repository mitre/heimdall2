const fs = require('fs')

const packageFile = 'package.json'
fs.copyFileSync(packageFile, `${packageFile}.orig`)

const input = JSON.parse(fs.readFileSync(packageFile, 'utf8'))

input.main = 'lib/bundle.js'

fs.writeFileSync(packageFile, JSON.stringify(input, null, 2))
