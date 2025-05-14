import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import BrowserSyncPlugin from 'browser-sync-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import postcssInlineSvg from 'postcss-inline-svg';
import autoprefixer from 'autoprefixer';
import ImageMinimizerPlugin  from 'image-minimizer-webpack-plugin';
import Imagemin from 'imagemin';
import ImageminMoz from 'imagemin-mozjpeg';
import ImageminPng from 'imagemin-pngquant';
import ghpages from 'gh-pages';
import * as cheerio from 'cheerio';
import fs from 'fs-extra';
import gitRepoInfo from 'git-repo-info';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const dirPaths= {
  entry: path.resolve(__dirname, 'src/origin'),
  output: path.resolve(__dirname, 'src/dist')
}
const entryPaths = {
  indexHTML: path.resolve(dirPaths.entry, 'index.html'),
  pagesHTML: path.resolve(dirPaths.entry, 'pages/'),
  indexJS: path.resolve(dirPaths.entry, 'index.js'),
  contentsJS: path.resolve(dirPaths.entry, 'assets/js/index.js'),
  modules: path.resolve(dirPaths.entry, 'assets/js/'),
  libJS: path.resolve(dirPaths.entry, 'assets/js/vendor.min.js'),
  images: path.resolve(dirPaths.entry, 'assets/img')
}
const outputPaths = {
  modules: `assets/js`,
  style: `assets/css`,
  images: path.resolve(dirPaths.output, `assets/img`)
}

let repoInfo=gitRepoInfo();
const deployMessage = () =>{
  let i = process.argv.indexOf("--message");
  return i !== -1? process.argv[i+1] : false;
}
const getHtmlFiles =  async()=>{
 let  fileList = (await fs.promises.readdir(entryPaths.pagesHTML)).filter(file=>file.endsWith('.html'))
 console.log(fileList)
 fileList.forEach((file,index,fileList)=>{
  const excludeTarget = (file==='index.html')?['contents'] : ['index'];
  fileList[index].push(new HtmlWebpackPlugin({
    excludeChunks: excludeTarget,
    filename: file,
    template: `${entryPaths.page}/${file}`,
    minify:false
  }))
  return fileList;
 })
  // await fs.promises.readdir(path.join(dirPath, theme));
}
// class CollectMetaDataPlugin {
//   apply(compiler) {
//     compiler.hooks.thisCompilation.tap('CollectMetaDataPlugin', (compilation) => {
//       let metaDataStore = [];
//       // HtmlWebpackPlugin의 beforeEmit 훅
//       HtmlWebpackPlugin.getHooks(compilation).beforeEmit.tapAsync(
//         'CollectMetaDataPlugin',
//       (data, callback) => {
//           // index.html은 제외
//           if (data.plugin.options.filename === 'index.html') {
//             callback(null);
//             return;
//           }
//           // HTML 내용 파싱
//           const $ = cheerio.load(data.html);
//           let wholeTitle = $('meta[name="list"]').attr('content') || $('title').text() ;
//           let splitTitle = wholeTitle.split(' : ');
//           let pageStatus = $('body').data('pagestatus');
//           let splitStatus = pageStatus ? pageStatus.split(' : ') : null;

//           // 메타 데이터 구성
//           const fileData = {
//             title: splitTitle[0] || '',
//             name: path.basename(data.plugin.options.filename),
//             category: path.basename(data.plugin.options.filename).substring(0, 2),
//             categoryText: splitTitle[1] || '',
//             listTitle: wholeTitle,
//             mdate: new Date(), // 소스 파일의 mtime을 사용할 경우 별도 처리
//             directory:data.plugin.options.filename, // views/폴더1/page1.html
//             filename: path.basename(data.plugin.options.filename), //page1.html
//           };

//           if (splitStatus) {
//             fileData.splitStatus = splitStatus[0];
//             fileData.splitStatusDate = splitStatus[1];
//           }

//           // <meta name="list"> 제거
//           if ($('meta[name="list"]').length) {
//             $('meta[name="list"]').remove();
//             data.html = $.html({ decodeEntities: false });
//           }

//           // 메타 데이터 저장
//           metaDataStore.push(fileData);
//           // 비동기적으로 디스크에 저장
//           callback(null);
//         }
//       );

//       // index.html의 templateParameters 수정
//       HtmlWebpackPlugin.getHooks(compilation).alterAssetTagGroups.tapAsync(
//         'CollectMetaDataPlugin',
//         (data, callback) => {
//           if (data.plugin.options.filename !== 'index.html') {
//             callback(null);
//             return;
//           }
//           // metaDataStore를 templateParameters에 추가
//           data.plugin.options.templateParameters = {
//             ...data.plugin.options.templateParameters,
//             info2: {
//               files: metaDataStore.reduce((acc, file) => {
                
//                 const theme = path.dirname(file.directory).split(path.sep)[1]; // 폴더1
//                 console.log('폴더:',theme)
//                 let group = acc.find(g => g[0].theme === theme);
//                 if (!group) {
//                   group = [{ theme }];
//                   acc.push(group);
//                 }
//                 group.push(file);
//                 console.log('group : ',group)
//                 return acc;
//               }, []),
//             },
//           };
//           callback(null);
//         }
//       );
//     });
//   }
// }
export default async(env)=> {
  const isProd = (env.NODE_ENV == 'stage' || env.NODE_ENV == 'live');
  const projectInfo = {
    projectName: 'Webpack Templates',
    projectAuthor: 'authorName',
    projectOrg: 'Interaction UI 개발 2팀',
  }
  const info = await getHtmlFiles();
  const isDev = (env.NODE_ENV == 'dev');
  const isRelease = (env.NODE_ENV == 'release');

    return {
      entry : {
        library:`${entryPaths.libJS}`,
        index: path.resolve(entryPaths.indexHTML),
        contents: path.resolve(entryPaths.contentsJS)
      },
      devtool: isProd ? '' : 'inline-source-map',
      output: {
        filename: '[name].js',
        path: dirPaths.output,
        clean: true,
      },
      mode: 'none',
      module: {
        rules:[
          {
            test: /\.(html|ejs)$/i,
            use:[
              {
                loader:'ejs-easy-loader',
                options: {
                  esModule: false,
                }
              }
            ]
          },
          {
            test:/\.scss$/,
            use: [
              MiniCssExtractPlugin.loader,
              {
                loader: 'css-loader',
                options:{
                  sourceMap: (!isProd),
                }
              },
              {
                loader: 'postcss-loader',
                options: {
                  postcssOptions: {
                    plugins: [
                      postcssInlineSvg({
                        paths: [path.resolve(__dirname, 'src/img/svg')],
                        encode: true,
                      }),
                      autoprefixer({
                        overrideBrowserslist: ['last 2 versions', '> 1%'],
                        remove: false,
                        cascade: false,
                      }),
                    ],
                  },
                },
              },
              {
                loader: 'sass-loader',
                options: {
                  sourceMap: !isProd,
                }
              }
            ]
          },
        ]
      },
      plugins: [
        new CopyWebpackPlugin({
          patterns: [
            {
              from: entryPaths.images,
              to: outputPaths.images,
              noErrorOnMissing: true,
              // flatten 효과는 아래처럼 context를 제거해주는 방식으로 대체 가능
              // context를 지정하면 하위 폴더 구조 유지됨, 없으면 flatten됨
              context: isProd ? undefined : entryPaths.images,
            },
          ],
        }),
        new HtmlWebpackPlugin({
          template: entryPaths.indexHTML,
          filename: 'index.html',
          templateParameters: {
            info,
            project:{
              projectName: projectInfo.projectName || '',
              projectOrg: projectInfo.projectOrg || '',
              projectAuthor: projectInfo.projectAuthor || ''
            },
          }
        }),
        new MiniCssExtractPlugin({
          filename: `${outputPaths.style}/[name].css`, // 출력 CSS 파일명
        }),
      ].concat(info),
      optimization: {
        minimize: isProd,
        minimizer: [
          ...(isProd ?
            [
              new ImageMinimizerPlugin({
              test: /\.(jpe?g|png|gif|svg)$/i,
              minimizer: {
                implementation: ImageMinimizerPlugin.imageminMinify,
                options :{
                  plugins:[
                    ['mozjpeg', { progressive: true }],
                    ['pngquant', { quality: [0.85, 0.85], strip: true }],
                    ['svgo', { plugins: [{ name: 'preset-default' }] }],
                  ]
                }
              },
            }),
            ]
          :[]),
        ],
      },
    }
    // const info = getHtmlFiles();
    // const htmlEl = [];
    // const seen = new Set();
    // const dirPath = 'src/views/';
    // try {
    //   const pathArr = await fs.promises.readdir(dirPath);
    //   for (const theme of pathArr) {
    //     const files = await fs.promises.readdir(path.join(dirPath, theme));
    //     const htmlFiles = files.filter(file => file.endsWith('.html'));
    //     for (const file of htmlFiles) {
    //       const dir = `src/views/${theme}`;
    //       const dir2 = `views/${theme}`;
    //       const key = `${dir2}/${file}`;
    //       if (!seen.has(key)) {
    //         seen.add(key);
    //         htmlEl.push({ file, dir, dir2 });
    //       }
    //     }
    //   }
    // } catch (err) {
    //   console.error('Error reading src/views:', err);
    //   // 빈 htmlEl 반환하여 빌드 계속 진행
    // }
  
  // return {
  // mode:'development',
  // entry: {
  //   main:entryPath,
  //   style: './src/css/scss/project.scss'
  // },
  // output: {
  //   filename: '[name].js',
  //   path: path.resolve(__dirname, 'dist'),
  //   clean: true,
  // },
  // module:{
  //   rules:[
  //     {
  //       test: /\.(ejs|html)$/i,
  //       use: [
  //         {
  //           loader:'ejs-easy-loader',
  //           options: {
  //             esModule: false,
  //           }
  //         }
  //       ],
  //     },
  //     // {
  //     //   test: /\.scss$/,
  //     //   use: [
  //     //     MiniCssExtractPlugin.loader,
  //     //     'css-loader',
  //     //     'sass-loader'

  //     //     // {
  //     //     //   loader:'postcss-loader',
  //     //     //   options: {
  //     //     //     postcssOptions: {
  //     //     //       plugins: [
  //     //     //         postcssInlineSvg({
  //     //     //           paths:[path.resolve(__dirname, 'src/img/svg')],
  //     //     //           encode:true
  //     //     //         })
  //     //     //       ]
  //     //     //     }
  //     //     //   }
  //     //     // },
  //     //   ]
  //     // },
  //   ]
  // },
  // plugins: [
  //   // new MiniCssExtractPlugin({
  //   //   filename: 'css/[name].css', // 출력 CSS 파일명
  //   // }),
  //   ...htmlEl.map((el) => {
  //     return new HtmlWebpackPlugin({
  //       template: path.resolve(el.dir, el.file),
  //       filename: path.join(`./${el.dir2}`, el.file),
  //     });
  //   }),
  //   new HtmlWebpackPlugin({
  //     template: './index.html',
  //     filename: 'index.html',
  //     templateParameters: {
  //       info,
  //       project:{
  //         projectName: projectInfo.projectName,
  //         projectOrg: projectInfo.projectOrg,
  //         projectAuthor: projectInfo.projectAuthor
  //       },
  //     }
  //   }),
  //   new CollectMetaDataPlugin(),
  //   new BrowserSyncPlugin({
  //     host: 'localhost',  //localhost로 사용
  //     port: 8080,			//포트 3000을 사용  (이미 사용중이면 1씩 증가된 포트로 사용)
  //     files: ['./dist/**'], //해당 경로 내 html 파일이 자동으로 동기화 (이 부분이 없으면 html파일 변경사항은 자동 동기화 안됨)
  //     server: { baseDir: ['dist'] } // server의 Base 디렉토리를 dist로 지정
  //   })
  // ],
  // // devtool: 'cheap-eval-source-map',
  // devServer: {
  //   static: {
  //     directory: path.join(__dirname, 'dist'),
  //   },
  //   compress:true,
  //   open:false,
  //   hot: false,
  //   liveReload: false,
  //     historyApiFallback: {
  //       index: '/index.html',
  //     },
  //     devMiddleware: {
  //       writeToDisk: true,
  //     },
  //     watchFiles: ['src/css/scss/*', 'index.html', 'src/views/*'],
  //     headers: {
  //       'Cache-Control': 'no-store',
  //     },
  //   },
  //   watchOptions: {
  //     ignored: /node_modules/,
  //   },
  // }
};