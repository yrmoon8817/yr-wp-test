var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const cheerio = require('cheerio');
const fs = require('fs-extra');

const generateHTML = async () => {
  let projectJson = JSON.parse(await fs.promises.readFile('templates/projectInfo.json', 'utf-8'));
  let projectInfo = {
    projectName: projectJson.project_name,
    projectAuthor: projectJson.author,
    projectOrg: projectJson.organization,
  };
  return {
    project: projectInfo,
    files: [],
  };
};

class CollectMetaDataPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('CollectMetaDataPlugin', (compilation) => {
      let metaDataStore = [];
      // HtmlWebpackPlugin의 beforeEmit 훅
      HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
        'CollectMetaDataPlugin',
        (data, callback) => {
          // index.html은 제외
          if (data.plugin.options.filename === 'index.html') {
            callback(null);
            return;
          }
          // HTML 내용 파싱
          const $ = cheerio.load(data.html);
          let wholeTitle = $('meta[name="list"]').attr('content') || $('title').text() ;
          let splitTitle = wholeTitle.split(' : ');
          let pageStatus = $('body').data('pagestatus');
          let splitStatus = pageStatus ? pageStatus.split(' : ') : null;

          // 메타 데이터 구성
          const fileData = {
            title: splitTitle[0] || '',
            name: path.basename(data.plugin.options.filename),
            category: path.basename(data.plugin.options.filename).substring(0, 2),
            categoryText: splitTitle[1] || '',
            listTitle: wholeTitle,
            mdate: new Date(), // 소스 파일의 mtime을 사용할 경우 별도 처리
            directory:data.plugin.options.filename, // views/폴더1/page1.html
            filename: path.basename(data.plugin.options.filename), //page1.html
          };

          if (splitStatus) {
            fileData.splitStatus = splitStatus[0];
            fileData.splitStatusDate = splitStatus[1];
          }

          // <meta name="list"> 제거
          if ($('meta[name="list"]').length) {
            $('meta[name="list"]').remove();
            data.html = $.html({ decodeEntities: false });
          }

          // 메타 데이터 저장
          metaDataStore.push(fileData);
          callback(null);
        }
      );

      // index.html의 templateParameters 수정
      HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync(
        'CollectMetaDataPlugin',
        (data, callback) => {
          if (data.plugin.options.filename !== 'index.html') {
            callback(null);
            return;
          }
          // metaDataStore를 templateParameters에 추가
          data.plugin.options.templateParameters = {
            ...data.plugin.options.templateParameters,
            info2: {
              files: metaDataStore.reduce((acc, file) => {
                
                const theme = path.dirname(file.directory).split(path.sep)[1]; // 폴더1
                console.log('폴더:',theme)
                let group = acc.find(g => g[0].theme === theme);
                if (!group) {
                  group = [{ theme }];
                  acc.push(group);
                }
                group.push(file);
                console.log('group : ',group)
                return acc;
              }, []),
            },
          };
          callback(null);
        }
      );
    });
  }
}
module.exports = async ()=> {
    const info = await generateHTML();
    const htmlEl = [];
    const seen = new Set();
    const dirPath = 'src/views/';
    try {
      const pathArr = await fs.promises.readdir(dirPath);
      for (const theme of pathArr) {
        const files = await fs.promises.readdir(path.join(dirPath, theme));
        const htmlFiles = files.filter(file => file.endsWith('.html'));
        for (const file of htmlFiles) {
          const dir = `src/views/${theme}`;
          const dir2 = `views/${theme}`;
          const key = `${dir2}/${file}`;
          if (!seen.has(key)) {
            seen.add(key);
            htmlEl.push({ file, dir, dir2 });
          }
        }
      }
    } catch (err) {
      console.error('Error reading src/views:', err);
      // 빈 htmlEl 반환하여 빌드 계속 진행
    }
  let entryPath = './src/index.js';
  
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
        project:{
          projectName: info.project.projectName,
          projectOrg: info.project.projectOrg,
          projectAuthor: info.project.projectAuthor
        },
      }
    }),
    new CollectMetaDataPlugin(),
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