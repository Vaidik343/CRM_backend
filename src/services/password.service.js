const crypto = require("crypto");

function generateTempPassword() {
  // 12-char base64url, readable enough for sharing once.
  return crypto.randomBytes(9).toString("base64url");
}

module.exports = { generateTempPassword };

