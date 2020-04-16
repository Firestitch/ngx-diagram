const sass = require('node-sass');
const fs = require('fs');
const tildeImporter = require('node-sass-tilde-importer');
const dir = require('node-dir');

dir.files('../build', function (err, files) {
  if (err) throw err;

  files = files.filter(function (file) {
    return (/scss$/g).test(file);
  });

  files.forEach((file) => {
    sass.render({
      file: file,
      importer: tildeImporter,
      outputStyle: 'compressed',
      outFile: './build'
    }, function (error, result) {
      if (error) {
        console.error(error.message);
      }
      else {
        console.log('Compilation - DONE');
        fs.writeFile(result.stats.entry.replace(/scss$/, 'css'), result.css, function (err) {
          if (!err) {
            console.info('Written - ' + result.stats.entry);
            // fs.unlink(file, function () {
            //   console.info('Removed - ' + result.stats.entry)
            // });
          } else {
            console.error('error in - ' + result.stats.entry);
            console.error(err)
          }
        });
      }
    });
  });
});
