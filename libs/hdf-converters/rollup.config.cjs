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
        stringPlugin.string({
            include: [
                "**/*.html",
                "**/*.css",
                "**/*.js.txt",
            ]
        })
    ]
}