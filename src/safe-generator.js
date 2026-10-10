const { generatePassword } = require("./generator");
const { checkPasswordBreach } = require("./hibp");

async function generateUnbreachedPassword({
  length = 20,
  noSymbols = false,
  maxAttempts = 5,
  generate = generatePassword,
  checkBreach = checkPasswordBreach,
} = {}) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError("maxAttempts must be a positive integer");
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const password = generate({ length, noSymbols });

    // If HIBP fails, propagate the error. Never distribute
    // a password whose breach status could not be checked.
    const result = await checkBreach(password);

    if (!result || typeof result.breached !== "boolean") {
      throw new Error("Invalid breach-check response");
    }

    if (!result.breached) {
      return password;
    }
  }

  throw new Error(
    `Could not generate an unbreached password after ${maxAttempts} attempts`,
  );
}

module.exports = { generateUnbreachedPassword };
