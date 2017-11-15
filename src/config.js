const config = {
  app: {
    url: 'https://www.messenger.com',
  },
  local: {
    port: 6005,
    host: 'localhost',
  }
};

module.exports = (key) => {
  return key.split('.').reduce((acc, val) => acc[val], config);
};
