var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const fs = require('fs');
// 폴더1, 폴더2 내의 모든 EJS 파일 목록 가져오기
const viewsDirs = [
  path.resolve(__dirname, 'src/views/폴더1'),
  path.resolve(__dirname, 'src/views/폴더2'),
];
const ejsFiles = viewsDirs
  .flatMap(dir => fs.readdirSync(dir).filter(file => file.endsWith('.ejs')))
  .map(file => ({
    file,
    dir: viewsDirs.find(dir => fs.existsSync(path.join(dir, file))),
  }));
module.exports =(env)=> {
  let entryPath = env.mode ==='production'? './dist/index.js':'./src/index.js';

  return {
  entry:entryPath,
  mode:env.mode==="production"? 'production' : 'development',
  entry: entryPath,
  output: {
    filename: 'bundle.[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
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
      // 폴더1, 폴더2 내 EJS 파일을 HTML로 출력
      ...ejsFiles.map(({ file, dir }) =>
        new HtmlWebpackPlugin({
          template: path.resolve(dir, file),
          filename: file.replace('.ejs', '.html'), // EJS -> HTML
          inject: true,
          hash: true,
        })
      ),
      // index.ejs를 기본 페이지로 출력
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, 'index.ejs'),
        filename: 'index.html',
        inject: true,
        hash: true,
        templateParameters: {
          project: {
            projectName: '샘플 프로젝트',
            projectOrg: 'Hivelab',
            projectAuthor: 'IUI',
          },
          files: [
            [
              { theme: '폴더1' },
              { name: 'page1.html', listTitle: '페이지 1 : 첫 번째 페이지', splitStatus: 'new', splitStatusDate: '2025-04-11' },
              { name: 'page2.html', listTitle: '페이지 2 : 두 번째 페이지', splitStatus: 'update', splitStatusDate: '2025-04-10' },
            ],
            [
              { theme: '폴더2' },
              { name: 'page3.html', listTitle: '페이지 3 : 세 번째 페이지', splitStatus: null, splitStatusDate: null },
            ],
          ],
        },
      }),
    // new HtmlWebpackPlugin({
    //   template: './index.ejs', // EJS 템플릿 경로
    //   filename: 'index.html',
    //   templateParameters: {
    //     project:{
    //       projectName: '샘플 프로젝트',
    //       projectOrg: 'Hivelab',
    //       projectAuthor: 'IUI'
    //     },
    //     files: [
    //       [
    //         { theme: '폴더1' },
    //         {
    //           name: 'page1.html',
    //           listTitle: '페이지 1 : 첫 번째 페이지',
    //           splitStatus: 'new',
    //           splitStatusDate: '2025-04-11',
    //         },
    //         {
    //           name: 'page2.html',
    //           listTitle: '페이지 2 : 두 번째 페이지',
    //           splitStatus: 'update',
    //           splitStatusDate: '2025-04-10',
    //         },
    //       ],
    //       [
    //         { theme: '폴더2' },
    //         {
    //           name: 'page3.html',
    //           listTitle: '페이지 3 : 세 번째 페이지',
    //           splitStatus: null,
    //           splitStatusDate: null,
    //         },
    //       ],
    //     ]
    //   }
    // }),
    // new CopyWebpackPlugin({
    //   patterns: [{ from: 'src/views', to: './views' }],
    // }),
    // new BrowserSyncPlugin({
    //   host: 'localhost',  //localhost로 사용
    //   port: 3000,			//포트 3000을 사용  (이미 사용중이면 1씩 증가된 포트로 사용)
    //   files: ['./dist/*.html'], //해당 경로 내 html 파일이 자동으로 동기화 (이 부분이 없으면 html파일 변경사항은 자동 동기화 안됨)
    //   server: { baseDir: ['dist'] } // server의 Base 디렉토리를 dist로 지정
    // })
  ],
  devServer: {
      static: {
        directory: path.resolve(__dirname, 'src'),
        watch: true,
      },
      watchFiles: [
        'src/**/*.ejs', // 모든 EJS 파일 감시
        'src/**/*.js', // 모든 JS 파일 감시
        'index.ejs',
      ],
      hot: true, // HMR 활성화
      liveReload: true, // HMR 실패 시 리로드
      open: true,
      port: 3000,
      client: {
        logging: 'verbose', // 디버깅 로그 활성화
        overlay: true, // 에러 오버레이
        reconnect: true, // 웹소켓 재연결
  },
  historyApiFallback: {
        index: '/index.html', // 모든 요청을 index.html로 리다이렉트
      },
      },
  // devtool: 'cheap-eval-source-map',
  // devServer: {
  //   // static: {
  //   //   directory: path.join(__dirname, 'dist'),
  //   // },
  //   compress:true,
  //   open:true,
  //   hot: true,
  //   liveReload: true,
  //     historyApiFallback: {
  //       index: '/index.html',
  //     },
  //     devMiddleware: {
  //       writeToDisk: true,
  //     },
  //     watchFiles: ['src/*', 'index.ejs'],
  //     headers: {
  //       'Cache-Control': 'no-store',
  //     },
  //     host: 'localhost',
  //     allowedHosts: 'all',
  //   },
  //   watchOptions: {
  //     ignored: /node_modules/,
  //     aggregateTimeout: 300,
  //     poll: 1000,
  //   },
  //   // proxy: {
  //   //   '/api': {
  //   //     target: 'domain.com',
  //   //     changeOrigin: true
  //   //   }
  //   // }
  
   }
};