const path = require("path");

/**
 * Resolve local .js imports within the source directory to .ts equivalents
 * because TypeScript requires .js imports but ts-jest needs to find .ts files.
 */
module.exports = (modulePath, options) => {
  if (
    options.rootDir != null &&
    /^\.\.?\//.test(modulePath) &&
    path.relative(options.rootDir, options.basedir).startsWith("src/") &&
    /\.js$/.test(modulePath)
  ) {
    return options.defaultResolver(modulePath.replace(/\.js$/, ".ts"), options);
  }
  return options.defaultResolver(modulePath, options);
};
