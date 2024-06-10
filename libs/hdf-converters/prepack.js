const fs = require('fs')

const packageFile = 'package.json'
fs.copyFileSync(packageFile, `${packageFile}.orig`)

const input = JSON.parse(fs.readFileSync(packageFile, 'utf8'))

input.main = 'lib/index.js'

fs.writeFileSync(packageFile, JSON.stringify(input, null, 2))

// copy template for hdf2html conversion into libs
fs.copyFileSync('templates/html/template.html', 'lib/templates/html/template.html');