const fs = require('fs');
const path = require('path');
const emojiMapper = require('./emojiMapper.json');
const sanitize = require("sanitize-filename");
const { getImageSrcs, downloadImage } = require('./helpers');

const getEmoji = (src) => {
  const mapperKey = src.split('/').reverse()[0];
  if (emojiMapper[mapperKey]) {
    return Promise.resolve(emojiMapper[mapperKey].value);
  } else {
    const filePath = path.join(__dirname, '../tmp/', sanitize(src));
    return downloadImage(src, filePath)
      .then(() => {
        emojiMapper[mapperKey] = {
          url: src,
          value: ':unknown_emoji:'
        };
        fs.writeFileSync(path.join(__dirname, './emojiMapper.json'), JSON.stringify(emojiMapper, null, 2));
        return emojiMapper[mapperKey].value;
      });
  }
};

module.exports = async (text, html) => {
  if(html.indexOf('<img') > -1) {
    const srcs = getImageSrcs(html)
      .filter((url) => url.indexOf('emoji.php') > -1);

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
