var path = require('path');
var HtmlWebpackPlugin = require('html-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const cheerio = require('cheerio');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageMinimizerPlugin=require('image-minimizer-webpack-plugin');
const fs = require('fs');
const gitRepoInfo =require('git-repo-info');
const fileURLToPath  =require('url');
const glob = require('glob');
const crypto = require('crypto');

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
function toSnakeCase(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2') // camelCase → snake_case
    .replace(/[\s\-]+/g, '_')               // 공백·하이픈 → _
    .replace(/_+/g, '_')                     // 중복 _ 제거
    .toLowerCase();
}

class GenerateSvgScssPlugin {
  constructor() {
    this.cache = null;
  }

  apply(compiler) {
    compiler.hooks.beforeCompile.tapAsync('GenerateSvgScssPlugin', (params, callback) => {
      const svgDir = path.resolve(__dirname, 'src/img/inline-svg');
      const outputPath = path.resolve(__dirname, 'src/css/scss/svg/_inline-svg-data.scss');
      const svgFiles = glob.sync(`${svgDir}/*.svg`);

      if (!svgFiles.length) {
        callback();
        return;
      }

      // 캐싱
      const fileHashes = svgFiles.map((file) => {
        const content = fs.readFileSync(file, 'utf8');
        return crypto.createHash('md5').update(content).digest('hex');
      });
      const combinedHash = crypto.createHash('md5').update(fileHashes.join('')).digest('hex');
      if (this.cache === combinedHash) {
        callback();
        return;
      }
      this.cache = combinedHash;

      let scssOutput = `// Auto-generated by GenerateSvgScssPlugin\n\n`;

      svgFiles.forEach((file) => {
        let svgContent = fs.readFileSync(file, 'utf8');

        // 1. SCSS 변수 부분을 토큰으로 교체 (변수명별로 다르게)
        svgContent = svgContent
          .replace(/fill="#[0-9a-fA-F]{6}|none"/g, `fill='___FILLCOLOR___'`)
          .replace(/stroke="#[0-9a-fA-F]{6}|none"/g, `stroke='___STROKECOLOR___'`)
          .replace(/(<circle[^>]*?)fill="#[0-9a-fA-F]{6}|none"/g, `fill='___CIRCLEFILLCOLOR___'`);

        // 2. 인코딩
        let encodedSvg = encodeURIComponent(svgContent);

        // 3. 토큰 복원 + 변수명 삽입 (여기서 작은 따옴표는 큰따옴표로 변환하여 오류 방지)
        encodedSvg = encodedSvg
          .replace(/___FILLCOLOR___/g, `#{$fillcolor}`)
          .replace(/___STROKECOLOR___/g, `#{$strokecolor}`)
          .replace(/___CIRCLEFILLCOLOR___/g, `#{$circlefillcolor}`);

        // 4. 인코딩된 > < 사이 공백 제거
        encodedSvg = encodedSvg.replace(/%3E%20%3C/g, '%3E%3C');

        const fileName = path.basename(file, '.svg');
        const functionName = toSnakeCase(fileName);

        scssOutput += `@function ${functionName}($fillcolor, $circlefillcolor, $strokecolor) {\n`;
        scssOutput += `  @return "data:image/svg+xml,${encodedSvg}";\n`;
        scssOutput += `}\n\n`;
      });

      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, scssOutput);

      callback();
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
  let entryPath = './src/js/index.js';

  return {
  entry:entryPath,
  mode:'none',
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
      },
      {
      test: /\.js$/,
      exclude: /node_modules/, // ✅ 여기!
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    },
    {
      test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader'
        ]
    },    
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
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/fonts'),
          to: path.resolve(__dirname, 'dist/fonts'),
        },
      ],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/img'),
          to: path.resolve(__dirname, 'dist/img'),
        },
      ],
    }),
    new GenerateSvgScssPlugin(),
  ],
  // devtool: 'cheap-eval-source-map',
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    devMiddleware: {
      writeToDisk: true
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
      watchFiles: ['src/*', 'index.html','!src/css/scss/svg/_inline-svg-data.scss'],
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