const fs = require('fs');
const path = require('path');
const emojiMapper = require('./emojiMapper.json');
const sanitize = require("sanitize-filename");
const request = require('request');

const getImageSrcs = (str) => {
  let m;
  let urls = [];
  let rex = /<img[^>]+src="?([^"\s]+)"?\s*\/?>/g;

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

const getEmoji = (src) => {
  if (emojiMapper[src]) {
    return Promise.resolve(emojiMapper[src]);
  } else {
    const filePath = path.join(__dirname, '../tmp/', sanitize(src));
    return downloadImage(src, filePath)
      .then(() => {
        emojiMapper[src] = ':unknown_emoji:';
        fs.writeFileSync(path.join(__dirname, './emojiMapper.json'), JSON.stringify(emojiMapper, null, 2));
        return ':unknown_emoji:';
      });
  }
};

module.exports = async (text, html) => {
  if(html.indexOf('<img') > -1) {
    const srcs = getImageSrcs(html);

    let promise = Promise.resolve();

    // Run getting emojis in series
    srcs.forEach((src) => {
      promise = promise
        .then(() => getEmoji(src))
        .then((emoji) => {
          text = text.concat(`${emoji}`);
        });
    });

    await promise;
  }

  return text;
};
