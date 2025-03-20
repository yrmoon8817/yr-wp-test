var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports =(env)=> {
  let entryPath = env.mode ==='production'? './dist/index.js':'index.js';

  return{
  entry:entryPath,
  mode: 'development',
  entry: './index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  // devtool: 'cheap-eval-source-map',
  devServer: {
    hot: true,
    port: 9000,
    // proxy: {
    //   '/api': {
    //     target: 'domain.com',
    //     changeOrigin: true
    //   }
    // }
  },
  plugins: [
    new HtmlWebpackPlugin({
      // index.html 템플릿을 기반으로 빌드 결과물을 추가해줌
      template: 'index.html'
    }),
  ],
}
};