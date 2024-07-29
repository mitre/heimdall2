const typescript = require('rollup-plugin-typescript2')
const json = require('@rollup/plugin-json')
const stringPlugin = require('rollup-plugin-string')
const { dependencies } = require('./package.json')

module.exports = {
    input: 'index.ts',
    output: {
        file: 'lib/bundle.js',
        format: 'cjs'
    },
    external: Object.keys(dependencies),
    plugins: [
        typescript({
            tsconfig: "tsconfig.build.json"
        }), 
        json(), 
        // these are to import template files as raw text for hdf to html conversion
        stringPlugin.string({
            include: [
                "**/*.html",
                "**/*.css",
                "**/*.js.txt", // this is so the file is treated as text and not JavaScript
            ]
        })
    ]
}