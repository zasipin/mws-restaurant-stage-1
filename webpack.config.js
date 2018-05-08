var webpack = require('webpack');
var path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
// const HtmlWebpackPlugin = require('html-webpack-plugin');
// const ScriptExtHtmlWebpackPlugin = require("script-ext-html-webpack-plugin");
// const ManifestPlugin = require('webpack-manifest-plugin');

var NODE_ENV = process.env.NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = {
  context: __dirname, // string (absolute path!)
  // the home directory for webpack
  // the entry and module.rules.loader option
  //   is resolved relative to this directory

  entry: {
    vendor: ['./js/common_functions.js', './js/db_helper.js'],
    main: './js/main.js', 
    restaurant: './js/restaurant_info.js', 
    styles_main: ['./css/styles_main.css', './css/styles_media.css'],
    styles_restaurant: ['./css/styles_restaurant.css', './css/styles_media.css']
  },
  plugins: [
    new CleanWebpackPlugin(['public'], {
        // exclude:  ['index.html']
      }
    ),

    new ExtractTextPlugin("[name].css"),

    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      path: path.resolve(__dirname, 'public'),
      filename: "[name].vendor.js"
    }),
    // new HtmlWebpackPlugin({
    //   template: path.resolve(__dirname, 'app') + '/index.html',
    //   filename: 'index.html',
    //   inject: 'body'
    // }),    
    // new ScriptExtHtmlWebpackPlugin({
    //   defaultAttribute: 'defer'
    // }),
    // new ManifestPlugin({
    //   fileName: 'assets-manifest.json'
    // })
  
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: "common",
    //   path: path.resolve(__dirname, 'public'),
    //   filename: "common.js"
    // //   // (Give the chunk a different name)

    // //   minChunks: Infinity,
    // //   // (with more entries, this ensures that no other module
    // //   //  goes into the vendor chunk)
    // })
  ],
  output: {
    //path: __dirname,
    path: path.resolve(__dirname, 'public'),
    filename: '[name].bundle.js',
    // chunkFilename: '[name].bundle.js'
  },
  resolve: {
    modules: [
      'node_modules',
      path.resolve(__dirname, "app/components"),
      path.resolve(__dirname, "app/api"),
      './app/components',
      './app/api'
    ],
    // extensions: [".js", ".json", ".jsx", ".css", ".scss"],
    // extensions that are used

    extensions: ['.js', '.jsx']
  },
  module: {
    // rules: [

    // ],
    loaders: [
      {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use:  [
                  {
                        loader :"css-loader",
                        options: { minimize: true }
                  },
                  {
                    loader :"sass-loader"
                  }
                ]
        })
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: {
                  loader :"css-loader",
                  options: { minimize: true }
              }
        })
      },
      {
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        },
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/        
      },
      // {
      //   test: /\.(eot|svg|ttf|woff|woff2)$/,
      //   loader: 'file-loader?name=public/fonts/[name].[ext]'
      // },

      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "url-loader?limit=40000&mimetype=application/font-woff&name=public/fonts/[name].[ext]",
         },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader?name=public/fonts/[name].[ext]" }
    ],
    noParse: /(jquery)/, 
  },
  //noParse: /(jquery)/, 
  devtool: process.env.NODE_ENV === 'production' ? undefined : 'cheap-module-eval-source-map'
};

if(NODE_ENV == 'production'){

  module.exports.plugins.push(
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(NODE_ENV)
      }
    })
  )
  module.exports.plugins.push(
    new webpack.optimize.UglifyJsPlugin({
      // warnings: false,
      // drop_console: true,
      compress: {
        warnings: false,
        drop_console: false,
        unsafe: true,
      }
    })
  );
}