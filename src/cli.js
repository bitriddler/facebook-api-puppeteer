require('dotenv').config();

const path = require('path');
const fs = require('fs');
const request = require('request');
const colors = require('colors/safe');
const argv = require('minimist')(process.argv.slice(2));
const prompt = require('prompt');
const Table = require('cli-table');
const sanitize = require("sanitize-filename");
const arToFranko = require('./arToFranko');
const convertEmoji = require('./convertEmoji');
const getConfig = require('./config');
const { getImageSrcs, downloadImage } = require('./helpers');

const getFullUrl = (url) => `http://${getConfig('local.host')}:${getConfig('local.port')}/${url}`;

const makeRequest = (url, body) => new Promise((resolve, reject) =>
  request({
    url: getFullUrl(url),
    method: 'POST',
    json: true,
    body,
  }, (err, response, body) => {
    if (!err && response.statusCode == 200) {
      resolve({response, body})
    } else {
      reject({err, response, body});
    }
  })
);

const logUsers = async ({body}) => {
  const table = new Table({
    head: ['No.', 'ID', 'Name'],
    chars: { 'top': '' , 'top-mid': '' , 'top-left': '' , 'top-right': ''
      , 'bottom': '' , 'bottom-mid': '' , 'bottom-left': '' , 'bottom-right': ''
      , 'left': '' , 'left-mid': '' , 'mid': '' , 'mid-mid': ''
      , 'right': '' , 'right-mid': '' , 'middle': ' ' },
  });

  table.push(
    ...body.map((user, index) => ([
      index + 1,
      user.id,
      user.name.slice(0, 50)
    ]))
  );

  console.log(table.toString());

  return body;
};

const isCurrentUser = (name) =>
  process.env.NICK_NAMES.toLowerCase().split(',').indexOf(name.toLowerCase()) > -1;

const downloadImages = (str, userName) => {
  const images = getImageSrcs(str)
    .filter((url) => url.indexOf('emoji.php') < 0);

  if(images.length === 0) {
    return;
  }

  const dateStr = sanitize(new Date().toISOString());
  const ext = str.split('.').reverse()[0];
  const dir = path.join(__dirname, `../tmp/${userName}/`);
  const filePath = path.join(dir, `${dateStr}.${ext}`);

  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }

  const promises = images.map((url) => downloadImage(url, filePath));
  return Promise.all(promises);
};

const prepareMessage = async (message) => {
  let result = await convertEmoji(message.bodyText, message.bodyHtml);
  await downloadImages(message.bodyHtml, message.name);
  return arToFranko(result);
};

const prepareName = async (name) => arToFranko(name);

const logMessages = ({body}) => {
  let promise = Promise.resolve();

  body.forEach((message) => {
    let name;

    promise = promise
      .then(() => prepareName(message.name))
      .then((userName) =>
        isCurrentUser(userName) ? colors.red(`Me: `) : colors.green(`${userName}: `))
      .then((_name) => name = _name)
      .then(() => prepareMessage(message))
      .then((prepared) => console.log(`${name}${prepared}`));
  });

  return promise;
};

let promptStarted = false;

const ask = (question, valueToUse) => {
  if(!!valueToUse) {
    return Promise.resolve({ [question]: valueToUse });
  }
  return new Promise((resolve, reject) => {
    if(! promptStarted) {
      prompt.start();
      promptStarted = true;
    }
    prompt.get([question], (err, answers) => {
      if (err) return reject(err);
      resolve(answers);
    });
  });
};

const getSessionAndWatch = (lastMessage = {}) => {
  let _body;
  return makeRequest('api/get-session')
    .then(({body}) => _body = body)
    .then(() => {
      const filteredMessages = [];
      for (let i = _body.length - 1; i >= 0; i--) {
        if (_body[i].bodyText && _body[i].bodyText === lastMessage.bodyText) {
          break;
        }
        filteredMessages.push(_body[i]);
      }

      return {body: filteredMessages.reverse()};
    })
    .then(logMessages)
    .then(() => {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          getSessionAndWatch(_body.reverse()[0])
            .then(resolve, reject);
        }, 3000);
      });
    });
};

const run = ({command}) => {
  switch (command) {
    case 'visible-users':
      return makeRequest('api/visible-users')
        .then(logUsers);
    case 'start-session':
      return run({ command: 'visible-users' })
        .then(users => {
          return ask('id')
            .then(({id}) => {
              if(id.toString().length > 2) {
                return {id};
              } else {
                return users[id - 1];
              }
            });
        })
        .then(answers => makeRequest('api/start-session', answers))
        .then(() => console.log('--------------------'))
        .then(() => run({ command: 'get-session' }));
    case 'send-session':
      return ask('message', process.argv.slice(3).join(' '))
        .then((answers) => makeRequest('api/send-session', answers))
        .then(() => console.log('--------------------'))
        .then(() => run({ command: 'get-session' }));
    case 'get-session':
      return makeRequest('api/get-session')
        .then(logMessages);
    case 'get-session-watch':
      return getSessionAndWatch();
    default:
      return Promise.resolve();
  }
};

run(argv)
  .catch(console.error);


