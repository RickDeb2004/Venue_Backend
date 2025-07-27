// api/index.js
const serverless = require("serverless-http");
const app = require("../server"); // import the main Express app

module.exports.handler = serverless(app);
