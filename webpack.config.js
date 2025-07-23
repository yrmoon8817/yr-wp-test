const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const postcssInlineSvg = require('postcss-inline-svg');
const cheerio = require('cheerio');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');
const fs = require('fs-extra');
const glob = require('glob');

function infoFunc (directory){
  const files =  fs.readdirSync(directory).filter(file => {
    if(file.indexOf('include')===-1) {
      const fullPath = path.join(directory, file);
      return fullPath;
    }
  });
  return files;
}
module.exports = ()=> {
  let dirNames = glob.sync('src/views/*');
  const info = {
    projectName: 'Webpack Template',
    projectAuthor: 'Author',
    projectOrg: 'IUI',
    files:[]
  };
  const infoArr = [];
  let files=[];
  for(let i=0; i<dirNames.length; i+=1){
    files.push(infoFunc(dirNames[i]));
  }
  const metaIndexPage = new HtmlWebpackPlugin({
    template:'./index.ejs',
    filename:'index.html',
    templateParameters:{
      metaList: infoArr
    }
  })
  // 각 파일마다 HTMLWebpackPlugin 인스턴스를 생성
  const htmlPlugins = files.map(file => {
    const name = path.basename(file, '.ejs');
    return new HtmlWebpackPlugin({
      template: '',
      filename: `${name}.html`
    })
  });
  function extractMetaFromEJS (directory){
    const metaArr = [];
    for(let i = 0; i< files.length; i+=1){
      const filePath = `${directory + '/' + files[i]}`;
      const content = fs.readFileSync(`${filePath}`, 'utf-8');
      const $ = cheerio.load(content);
      const title = $('title').text();
      const description = $('meta[name="list"]').attr('content') || '';

      metaArr.push({
       file:files[i], title, description
      })
    }
    return metaArr;
  }
  
  return {
    entry:{ main:'./index.js'},
    mode:'development',
    output: {
      path:path.resolve(__dirname, 'dist'),
      clean: true
    },
    plugins: [
      ...htmlPlugins,
      ()=>{
        let metaInfo = files.map(file=>{
          extractMetaFromEJS(file);
        });
        return infoArr.push([...metaInfo]);
      },
      metaIndexPage,
    ],
    module:{
      rules:[
        {
          test: /\.(ejs)$/i,
          use: [
            {
              loader: 'ejs-easy-loader',
              options: {
                exModule: false, 
              }
            }
          ]
        }
      ]
    }
  }
};
