const request = require('request');
const colors = require('colors/safe');
const argv = require('minimist')(process.argv.slice(2));
const prompt = require('prompt');
const arToFranko = require('./arToFranko');
const convertEmoji = require('./convertEmoji');
const getConfig = require('./config');

require('dotenv').config();

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

const logUsers = ({body}) => {
  body.forEach((user) => console.log(`${user.id}`));
  return body;
};

const prepareMessage = async (message) => {
  let result = await convertEmoji(message.bodyText, message.bodyHtml);
  return arToFranko(result);
};

const getNickNames = () => process.env.NICK_NAMES.split(',');

const logMessages = ({body}) => {
  let promise = Promise.resolve();

  body.forEach((message) => {
    const name = getNickNames().indexOf(message.name.toLowerCase()) > -1 ? colors.red('Me: ') : colors.green(`${message.name}: `);

    promise = promise
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


