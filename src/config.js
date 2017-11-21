const config = {
  app: {
    url: 'https://www.messenger.com',
  },
  local: {
    port: process.env.PORT,
    host: 'localhost',
  }
};

module.exports = (key) => {
  return key.split('.').reduce((acc, val) => acc[val], config);
};
