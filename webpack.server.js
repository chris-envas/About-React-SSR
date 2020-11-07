const path = require('path')
const nodeExternals = require('webpack-node-externals')
const merge = require('webpack-merge')
const baseConfig = require('./webpack.base.js')

module.exports = merge(baseConfig, {
    target: 'node', // support node environment,
    mode: 'development',
    entry: './src/server/index.js',
    externals: [nodeExternals()],
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'build')
    },
    module: {
        rules: [
            {
                test: /\.css?$/,
                use: [
                    { loader: 'isomorphic-style-loader' },
                    {
                      loader: 'css-loader',
                      options: {
                        modules: true
                      }
                    }
                  ]
            }
        ]
    }
})