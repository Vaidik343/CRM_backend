const crypto = require("crypto");

function generateTempPassword(name) {
  const prefix = name.trim().slice(0, 3).toLowerCase();
  const digits = Math.floor(1000 + crypto.randomInt(9000)).toString();
  return `${prefix}${digits}`;
}

module.exports = { generateTempPassword };