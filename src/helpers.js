const fs = require('fs');
const request = require('request');

const getImageSrcs = (str) => {
  const urls = [];
  const rex = /<img[^>]+src="?([^"\s]+)"?\s*\/?>/g;
  let m;

  while ( m = rex.exec( str ) ) {
    urls.push( m[1] );
  }

  return urls;
};

const downloadImage = (uri, filename) => {
  return new Promise((resolve, reject) => {
    request.head(uri, function(err){
      if(err) {
        return reject(err);
      }

      request(uri)
        .pipe(fs.createWriteStream(filename))
        .on('close', resolve);
    });
  });
};

module.exports = {
  getImageSrcs,
  downloadImage,
};
