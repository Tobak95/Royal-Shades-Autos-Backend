const crypto = require("crypto");
//the crypto module is a built-in module in Node.js that provides cryptographic functionality

const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

module.exports = generateToken;
