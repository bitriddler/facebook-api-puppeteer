const puppeteer = require('puppeteer');
const getConfig = require('./config');
const {
  extractMessages,
  extractUsers,
} = require('./scrappers');

let browser, page, startedSession;

const launch = async () => {
  browser = await puppeteer.launch({
    headless: true,
  });
  page = await browser.newPage();
  await page.goto(`${getConfig('app.url')}`);
  await page.waitFor(2000);
};

const login = async ({email, password}) => {
  await page.waitFor('input[name="email"]');
  await page.focus('input[name="email"]');
  await page.type('input[name="email"]', email);
  await page.focus('input[name="pass"]');
  await page.type('input[name="pass"]', password);
  await page.waitFor(500);
  await page.click('button[name="login"]');
};

const openUser = async ({id}) => {
  const $u = `a[data-href*="${id}"]`;
  await page.waitFor($u);
  await page.click($u);
  await page.waitFor(500);
};

const sendMessage = async ({id, message}) => {
  const $nM = `div[aria-label="New message"]`;
  const $b = `a[data-tooltip-content*="Press Enter to send"]`;
  await openUser({id});
  await page.click($nM);
  await page.type($nM, message);
  await page.waitFor(200);
  await page.click($b);
};

const getVisibleUsers = async () => {
  const $wrapper = `div[aria-label="Conversations"]`;
  const body = await page.$($wrapper);
  const html = await body.getProperty('innerHTML').then((val) => val.jsonValue());
  return extractUsers(html);
};

const getVisibleUser = async ({id}) => {
  const visibleUsers = await getVisibleUsers();
  return visibleUsers.find((user) => user.id === id);
};

const getLatestMessages = async ({id}) => {
  const all = await getAllMessages({id});
  const filtered = [];
  for (let i = all.length - 1; i >= 0; i--) {
    if (all[i].me) {
      break;
    }
    filtered.push(all[i]);
  }
  return filtered;
};

const getAllMessages = async ({id}) => {
  const $ms = `div[aria-label="Messages"]`;
  await openUser({id});
  const ms = await page.$($ms);
  const html = await ms.getProperty('innerHTML').then((val) => val.jsonValue());
  const visibleUser = await getVisibleUser({id});
  return extractMessages(html, visibleUser);
};

const startSession = async ({id}) => {
  await openUser({id});
  const visibleUser = await getVisibleUser({id});
  if (!visibleUser) {
    throw new Error("can't find this user!");
  }
  startedSession = visibleUser;
};

const sendSession = async ({message}) => {
  if (!startedSession) {
    throw new Error("Session hasn't been started yet!");
  }
  await sendMessage({...startedSession, message});
};

const getLatestMessagesSession = async () => {
  if (!startedSession) {
    throw new Error("Session hasn't been started yet!");
  }
  return getLatestMessages(startedSession);
};

const getMessagesSession = async () => {
  if (!startedSession) {
    throw new Error("Session hasn't been started yet!");
  }
  return getAllMessages(startedSession);
};

module.exports = {
  launch,
  login,
  sendMessage,
  getAllMessages,
  getLatestMessages,
  getVisibleUsers,
  startSession,
  sendSession,
  getLatestMessagesSession,
  getMessagesSession,
};
