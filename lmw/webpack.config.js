const path = require('path')
const BundleTracker = require('webpack-bundle-tracker')
//const { CleanWebpackPlugin } = require('clean-webpack-plugin')

module.exports = {
  entry: {
    frontend: './dictionary/src/index.js',
  },
  output: {
    path: path.resolve('./dictionary/static/dictionary/'),
//    filename: '[name]-[fullhash].js',
    filename: 'react-bundle.js',
    publicPath: '/static/dictionary/',
  },
  plugins: [
//    new CleanWebpackPlugin(),
    new BundleTracker({
      path: __dirname,
      filename: 'webpack-stats.json',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
}
