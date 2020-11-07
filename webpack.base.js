module.exports = {
    module: {
        rules: [{
            test: /\.js?$/,
            loader: 'babel-loader',
            exclude: '/node_module/',
            options: {
                presets: ['@babel/preset-react', ['@babel/preset-env', {
                    targets: {
                        browsers: ['last 2 versions']
                    }
                }]]
            }
        },{
            test: /\.(png|jpg|gif|)$/,
            use: [{
                loader:'url-loader',
                options: {
                    limit: 500000
                }
            }]
        }]
    }
}