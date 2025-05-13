var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const cheerio = require('cheerio');
const fs = require('fs-extra');

const generateHTML = async () => {
  const dirPath = 'dist/views/';
  const pathArr = await fs.promises.readdir(dirPath);
  const dirPathArr = pathArr.map(path => `${dirPath}${path}`);

  let fileObjArr = [];
  let categories = [];
  let projectJson = JSON.parse(await fs.promises.readFile('templates/projectInfo.json', 'utf-8'));
  let projectInfo = {
    projectName: projectJson.project_name,
    projectAuthor: projectJson.author,
    projectOrg: projectJson.organization,
  };

  await Promise.all(
    dirPathArr.map(async (pathname, idx) => {
      const files = await fs.promises.readdir(pathname);
      const htmlFiles = files.filter(file => file.endsWith('.html'));

      for (const file of htmlFiles) {
        const filePath = `${pathname}/${file}`;
        const stats = await fs.promises.stat(filePath);
        const fileInnerText = await fs.promises.readFile(filePath, 'utf8');
        const $ = cheerio.load(fileInnerText);

        let wholeTitle = $('meta[name="list"]').attr('content') || $('title').text();
        let splitTitle = wholeTitle.split(' : ');
        let pageStatus = $('body').data('pagestatus');
        let splitStatus = pageStatus ? pageStatus.split(' : ') : null;

        let fileData = {
          title: splitTitle[0],
          name: file,
          category: file.substring(0, 2),
          categoryText: splitTitle[1],
          listTitle: wholeTitle,
          mdate: stats.mtime,
        };

        if (splitStatus) {
          fileData.splitStatus = splitStatus[0];
          fileData.splitStatusDate = splitStatus[1];
        }

        if (!fileObjArr[idx]) fileObjArr[idx] = [{ theme: pathArr[idx] }];
        fileObjArr[idx].push(fileData);

        if (!categories.includes(fileData.category)) categories.push(fileData.category);

        if ($('meta[name="list"]').length) {
          $('meta[name="list"]').remove();
          await fs.promises.writeFile(filePath, $.html({ decodeEntities: false }));
        }
      }
    })
  );

  let projectObj = {
    project: projectInfo,
    files: fileObjArr,
  };
  return projectObj;
  // return src('templates/@index.html')
  //   .pipe(ejs(projectObj))
  //   .pipe(dest('dist/'))
  //   .on('end', done);
};
module.exports = async (env)=> {
  let entryPath = env.mode ==='production'? './dist/index.js':'./src/index.js';
  const info = await generateHTML();
  console.log(info.files)
  return {
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
        test: /\.ejs$/i,
        use: [
          {
            loader:['ejs-easy-loader'],
            options: {
              esModule: false,
            }
          }
        ],
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
      templateParameters: {
        project:{
          projectName: info.project.projectName,
          projectOrg: info.project.projectOrg,
          projectAuthor: info.project.projectAuthor
        },
        files: info.files
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
      watchFiles: ['src/*', 'index.html'],
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