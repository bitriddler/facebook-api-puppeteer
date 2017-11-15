const express = require('express');
const app = express();
const colors = require('colors/safe');
const bodyParser = require('body-parser');
const fbRobot = require('./fbRobot');
const getConfig = require('./config');

require('dotenv').config();

// parse various different custom JSON types as JSON
const run = async () => {
  await fbRobot.launch();
  await fbRobot.login({
    email: process.env.FB_EMAIL,
    password: process.env.FB_PASSWORD,
  });

  app.use(bodyParser.json());

  app.post('/api/send', async (req, res, next) => {
    try {
      await fbRobot.sendMessage(req.body);
      res.send('done');
    } catch (er) {
      next(er);
    }
  });

  app.post('/api/get', async (req, res, next) => {
    try {
      const values = await fbRobot.getAllMessages(req.body);
      res.send(values);
    } catch (er) {
      next(er);
    }
  });

  app.post('/api/get-latest', async (req, res, next) => {
    try {
      const values = await fbRobot.getLatestMessages(req.body);
      res.send(values);
    } catch (er) {
      next(er);
    }
  });

  app.post('/api/visible-users', async (req, res, next) => {
    try {
      const values = await fbRobot.getVisibleUsers();
      res.send(values);
    } catch (er) {
      next(er);
    }
  });

  app.post('/api/start-session', async (req, res, next) => {
    try {
      const values = await fbRobot.startSession(req.body);
      res.send(values);
    } catch (er) {
      next(er);
    }
  });

  app.post('/api/send-session', async (req, res, next) => {
    try {
      await fbRobot.sendSession(req.body);
      res.send('done');
    } catch (er) {
      next(er);
    }
  });

  app.post('/api/get-latest-session', async (req, res, next) => {
    try {
      const values = await fbRobot.getLatestMessagesSession();
      res.send(values);
    } catch (er) {
      next(er);
    }
  });

  app.post('/api/get-session', async (req, res, next) => {
    try {
      const values = await fbRobot.getMessagesSession();
      res.send(values);
    } catch (er) {
      next(er);
    }
  });

  app.use((er, req, res, next) => {
    console.error(er);
    res.status(500).send(er);
  });

  console.log(colors.green('App started'));

  app.listen(getConfig('local.port'));
};

run()
  .catch(console.error);
