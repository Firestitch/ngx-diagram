exports.webpack_scss_inline_loaders = [
  { loader: 'to-string-loader', options: { sourceMap: true } },
  { loader: 'css-loader', options: { sourceMap: true } },
  { loader: 'postcss-loader', options: { sourceMap: true } },
  { loader: 'resolve-url-loader', options: { sourceMap: true } },
  { loader: 'sass-loader', options: { sourceMap: true } }
];

exports.webpack_css_inline_loaders = [
  { loader: 'to-string-loader', options: { sourceMap: true } },
  { loader: 'css-loader', options: { sourceMap: true } },
  { loader: 'postcss-loader', options: { sourceMap: true } },
  { loader: 'resolve-url-loader', options: { sourceMap: true } }
];


exports.webpack_scss_extract_loaders = [
  { loader: 'css-loader', options: { sourceMap: true } },
  { loader: 'postcss-loader', options: { sourceMap: true } },
  { loader: 'resolve-url-loader', options: { sourceMap: true } },
  { loader: 'sass-loader', options: { sourceMap: true } }
];

exports.webpack_css_extract_loaders = [
  { loader: 'to-string-loader', options: { sourceMap: true } },
  { loader: 'css-loader', options: { sourceMap: true } },
  { loader: 'postcss-loader', options: { sourceMap: true } },
  { loader: 'resolve-url-loader', options: { sourceMap: true } }
];
