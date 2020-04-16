const fs = require('fs');

const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

const args = process.argv.slice(2).reduce((acc, arg) => {

  if (arg.indexOf('--') === 0) {
    arg = arg.slice(2);
  }

  let [flag, value] = arg.indexOf('=') > -1 ? arg.split('=') : arg;
  acc[flag] = value;

  return acc;
}, {});

if (fs.existsSync(args.packageDir)) {
  rmdirRecursive(args.packageDir);
  console.log(BLUE, 'Removing old package directory', RESET);
}

console.log(BLUE, 'Creating package directory', RESET);
fs.mkdirSync(args.packageDir);

function rmdirRecursive(path) {
  var files = [];
  if( fs.existsSync(path) ) {
      files = fs.readdirSync(path);
      files.forEach(function(file,index){
          var curPath = path + "/" + file;
          if(fs.lstatSync(curPath).isDirectory()) { // recurse
            rmdirRecursive(curPath);
          } else { // delete file
              fs.unlinkSync(curPath);
          }
      });
      fs.rmdirSync(path);
  }
};