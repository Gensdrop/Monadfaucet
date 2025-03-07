module.exports = {
  env: {
    MONAD_PRIVATE_KEY: process.env.MONAD_PRIVATE_KEY,
  },
  webpack: (config) => {
    config.cache = false;
    config.watchOptions = {
      ignored: ["/data/**", "/proc/**", "/sys/**", "/node_modules/**"],
    };
    return config;
  },
};
