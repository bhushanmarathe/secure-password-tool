const crypto = require("node:crypto");

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{};:,.?";

function secureRandomChar(characters) {
  return characters[crypto.randomInt(characters.length)];
}

function generatePassword({ length = 20, noSymbols = false } = {}) {
  if (!Number.isInteger(length) || length < 16 || length > 24) {
    throw new RangeError("Password length must be between 16 and 24");
  }

  const pools = [UPPERCASE, LOWERCASE, DIGITS];

  if (!noSymbols) {
    pools.push(SYMBOLS);
  }

  // Guarantee at least one character from every required pool.
  const passwordChars = pools.map(secureRandomChar);

  // Fill the remaining positions using all allowed characters.
  const allCharacters = pools.join("");

  while (passwordChars.length < length) {
    passwordChars.push(secureRandomChar(allCharacters));
  }

  // Shuffle so the required characters aren't always at the beginning.
  for (let i = passwordChars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join("");
}

module.exports = { generatePassword };
