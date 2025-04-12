var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');


module.exports =(env)=> {
  let entryPath = env.mode ==='production'? './dist/index.js':'./src/index.js';

  return{
  entry:entryPath,
  mode:env.mode==="production"? 'production' : 'development',
  entry: entryPath,
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  watch: true,
  module:{
    rules:[
      {
        test: /\.ejs$/,
        use: [
          {
            loader:'ejs-loader',
            options: {
              esModule: false
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.ejs', // EJS 템플릿 경로
      filename: 'index.html',
      templateParameters: {
        project:{
          projectName: '샘플 프로젝트',
          projectOrg: 'Hivelab',
          projectAuthor: 'IUI'
        },
        files: [
          [
            { theme: '폴더1' },
            {
              name: 'page1.html',
              listTitle: '페이지 1 : 첫 번째 페이지',
              splitStatus: 'new',
              splitStatusDate: '2025-04-11',
            },
            {
              name: 'page2.html',
              listTitle: '페이지 2 : 두 번째 페이지',
              splitStatus: 'update',
              splitStatusDate: '2025-04-10',
            },
          ],
          [
            { theme: '폴더2' },
            {
              name: 'page3.html',
              listTitle: '페이지 3 : 세 번째 페이지',
              splitStatus: null,
              splitStatusDate: null,
            },
          ],
        ]
      }
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: 'src/views', to: './views' }],
    }),
    new BrowserSyncPlugin({
      host: 'localhost',  //localhost로 사용
      port: 3000,			//포트 3000을 사용  (이미 사용중이면 1씩 증가된 포트로 사용)
      files: ['./dist/*.html'], //해당 경로 내 html 파일이 자동으로 동기화 (이 부분이 없으면 html파일 변경사항은 자동 동기화 안됨)
      server: { baseDir: ['dist'] } // server의 Base 디렉토리를 dist로 지정
    })
  ],
  // devtool: 'cheap-eval-source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress:true,
    open:true,
    hot: true,
    liveReload: true,
      historyApiFallback: {
        index: '/index.html',
      },
      devMiddleware: {
        writeToDisk: true,
      },
      watchFiles: ['src/*', 'index.ejs'],
      headers: {
        'Cache-Control': 'no-store',
      },
      host: 'localhost',
      allowedHosts: 'all',
    },
    watchOptions: {
      ignored: /node_modules/,
      aggregateTimeout: 300,
      poll: 1000,
    },
    // proxy: {
    //   '/api': {
    //     target: 'domain.com',
    //     changeOrigin: true
    //   }
    // }
  
}
};