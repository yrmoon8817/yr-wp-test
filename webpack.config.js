const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const postcssInlineSvg = require('postcss-inline-svg');
const cheerio = require('cheerio');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin')
const fs = require('fs-extra');

// const generateHTML = async () => {
//   let projectJson = JSON.parse(await fs.promises.readFile('templates/projectInfo.json', 'utf-8'));
//   let projectInfo = {
//     projectName: projectJson.project_name,
//     projectAuthor: projectJson.author,
//     projectOrg: projectJson.organization,
//   };
//   return {
//     project: projectInfo,
//     files: [],
//   };
// };
// class CollectMetaPlugin {
//   constructor() {
//     this.metaMap = new Map();
//   }

//   apply(compiler) {
//     compiler.hooks.thisCompilation.tap('CollectMetaPlugin', (compilation) => {
//       const HtmlWebpackPlugin = require('html-webpack-plugin');
//       const hooks = HtmlWebpackPlugin.getHooks;

//       // 각 html 파일에서 메타데이터 추출
//       hooks(compilation).beforeEmit.tapAsync('CollectMetaPlugin', (data, cb) => {
//         const filename = data.outputName;
//         const html = data.html;

//         // 메타 태그 추출 로직
//         const metaMatch = html.match(/<meta name="(.+?)" content="(.+?)">/g) || [];
//         const metas = metaMatch.map((tag) => {
//           const name = tag.match(/name="(.+?)"/)?.[1];
//           const content = tag.match(/content="(.+?)"/)?.[1];
//           return { name, content };
//         });

//         // 메타 정보 누적
//         this.metaMap.set(filename, metas);

//         cb(null, data);
//       });

//       // 모든 HTML 파일 처리가 끝난 뒤 index.html을 수정
//       compilation.hooks.afterSeal.tapPromise('CollectMetaPlugin', async () => {
//         const indexAssetName = 'index.html';
//         const asset = compilation.assets[indexAssetName];

//         if (!asset) return;

//         let indexHtml = asset.source();

//         const metaListHtml = Array.from(this.metaMap.entries())
//           .filter(([filename]) => filename !== indexAssetName)
//           .map(([filename, metas]) => {
//             const metaText = metas.map(({ name, content }) => `<li>${name}: ${content}</li>`).join('');
//             return `<li><strong>${filename}</strong><ul>${metaText}</ul></li>`;
//           }).join('');

//         const marker = '<!-- __META_LIST__ -->';
//         indexHtml = indexHtml.replace(marker, `<ul>${metaListHtml}</ul>`);

//         // 최종 결과를 다시 자산에 등록
//         compilation.assets[indexAssetName] = {
//           source: () => indexHtml,
//           size: () => indexHtml.length,
//         };
//       });
//     });
//   }
// }


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
          // 비동기적으로 디스크에 저장
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
    const info = {
      projectName: 'Webpack Template',
      projectAuthor: 'Author',
      projectOrg: 'IUI',
      files:[]
    };
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
  entry: {
    main:entryPath,
    style: './src/css/scss/project.scss'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
    cache: {
    type: 'filesystem', 
    cacheDirectory: path.resolve(__dirname, '.webpack_cache'),
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
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader:'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  postcssInlineSvg({
                    paths:[path.resolve(__dirname, 'src/img/svg')],
                    encode:true
                  })
                ]
              }
            }
          },
          'sass-loader'
        ]
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'img/[name][ext]'
        }
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].css', // 출력 CSS 파일명
    }),
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
          projectName: info.projectName,
          projectOrg: info.projectOrg,
          projectAuthor: info.projectAuthor
        },
      }
    }),
    new CollectMetaDataPlugin(),
    // new BrowserSyncPlugin({
    //   host: 'localhost',  //localhost로 사용
    //   port: 8080,			//포트 3000을 사용  (이미 사용중이면 1씩 증가된 포트로 사용)
    //   files: ['./dist/**'], //해당 경로 내 html 파일이 자동으로 동기화 (이 부분이 없으면 html파일 변경사항은 자동 동기화 안됨)
    //   server: { baseDir: ['dist'] } // server의 Base 디렉토리를 dist로 지정
    // })
    new ImageMinimizerPlugin({
      test: /\.(jpe?g|png|gif|svg)$/i,
      minimizer:{
        implementation: ImageMinimizerPlugin.imageminMinify,
        options:{
          plugins: [
            ['gifsicle', {interlaced:true}],
            ['mozjpeg', {quality:80, progressive: true}],
            ['optipng', {optimizationLevel:5},],
            ['svgo', 
              {
                plugins: [
                  {name: 'removeViewBox', active:true},
                  {name: 'cleanupIDs', active:false}
                ]
              }
            ]
          ]
        }
      },
      generator: [
        {
          type:'asset',
          implementation:(content,resource)=>{
            console.log(`Optimized: ${resource.filename} (${(content.length/1024).toFixed(2)}) KB`);
            return content;
          }
        }

      ]
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
    liveReload: false,
      historyApiFallback: {
        index: '/index.html',
      },
      devMiddleware: {
        writeToDisk: true,
      },
      watchFiles: ['src/css/scss/*', 'index.html', 'src/views/*'],
      headers: {
        'Cache-Control': 'no-store',
      },
      host:'localhost',
      port:8080,
    },
    watchOptions: {
      ignored: /node_modules/,
    },
  }
};