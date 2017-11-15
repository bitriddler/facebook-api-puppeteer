const cheerio = require('cheerio');
const getConfig = require('./config');

const extractUsers = (html) => {
  const userSelectorClass = "_1ht6";
  const $ = cheerio.load(html);
  const users = [];
  $(`a[data-href*="${getConfig('app.url')}"]`)
    .each(function () {
      const name = $(this).find(`.${userSelectorClass}`).text();
      const url = $(this).attr('data-href');
      const id = url.split('/').reverse()[0];
      users.push({
        url,
        id,
        name
      });
    });
  return users;
};

const extractMessages = (html, {name} = {}) => {
  const $ = cheerio.load(html);
  const values = [];
  let currentName = '';
  $('div[attachments*="List"]')
    .each(function () {
      const $title = $(this).parent().prev();

      if ($title[0] && $title[0].name === 'h5') {
        currentName = $title.text();
      }

      values.push({
        me: currentName.indexOf(name) < 0,
        name: currentName,
        bodyHtml: $(this).html(),
        bodyText: $(this).text(),
      });
    });

  return values;
};

module.exports = {
  extractUsers,
  extractMessages,
};
