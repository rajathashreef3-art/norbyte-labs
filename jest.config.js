/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['server.js', 'script.js', 'admin.js'],
  coverageDirectory: 'coverage',
  // Browser files are executed inside a jsdom sandbox created per-test
  // (see tests/helpers/loadBrowserScript.js), so a plain node env is enough.
};
