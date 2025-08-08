var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const cheerio = require('cheerio');
const fs = require('fs-extra');

const generateHTML = async (dir) => {
  const dirPath = `${dir? dir : 'src/'}views/`;
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
};
module.exports = async (env)=> {
  const info = await generateHTML();
  let entryPath = './dist/index.js';
  const htmlEl = [];
  
  for(let g=0; g<info.files.length; g+=1){
    for(let w=1; w< info.files[g].length; w+=1){
      htmlEl.push({
        file:`${info.files[g][w].name}`,
        dir: `src/views/${info.files[g][0].theme}`,
        dir2: `views/${info.files[g][0].theme}`,
      })
    }
  }
  return {
  entry:entryPath,
  mode:'development',
  entry: entryPath,
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  module:{
    rules:[
      {
        test: /\.(ejs|html)$/i,
        use: [
          {
            loader:'ejs-easy-loader',
            options: {
              esModule: false,
            }
          }
        ],
      }
    ]
  },
  plugins: [
    ...htmlEl.map((el) => {
      return new HtmlWebpackPlugin({
        template: path.resolve(el.dir, el.file),
        filename: path.join(`./${el.dir2}`, el.file),
      });
    }),
    new HtmlWebpackPlugin({
      template: './index.html',
      filename: 'index.html',
      templateParameters: {
        info,
        info2:async()=>{return await generateHTML('dist/')},
        project:{
          projectName: info.project.projectName,
          projectOrg: info.project.projectOrg,
          projectAuthor: info.project.projectAuthor
        },
      }
    }),
    new BrowserSyncPlugin({
      host: 'localhost',  //localhost로 사용
      port: 8080,			//포트 3000을 사용  (이미 사용중이면 1씩 증가된 포트로 사용)
      files: ['./dist/**/*.html'], //해당 경로 내 html 파일이 자동으로 동기화 (이 부분이 없으면 html파일 변경사항은 자동 동기화 안됨)
      server: { baseDir: ['dist'] } // server의 Base 디렉토리를 dist로 지정
    })
  ],
  // devtool: 'cheap-eval-source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    compress:true,
    open:false,
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
}
};