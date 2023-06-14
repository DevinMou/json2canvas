const path = require('path')

module.exports = {
  entry: './src/json2canvas/index.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  experiments: {
    outputModule: true
  },
  output: {
    filename: 'json2canvas.min.js',
    path: path.resolve(__dirname, 'build'),
    libraryTarget: 'module'
  }
}
