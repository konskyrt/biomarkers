module.exports = function override(config, env) {
    // Set fallbacks for Node modules not needed in the browser.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      os: false,
      tty: false,
      child_process: false,
    };
  
    // Add alias for "asciify-image" to point to an empty module.
    config.resolve.alias = {
      ...config.resolve.alias,
      "asciify-image": require.resolve("./polyfills/empty.js")
    };
  
    return config;
  };
  