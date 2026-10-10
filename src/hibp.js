const crypto = require("node:crypto");

const HIBP_API_URL = "https://api.pwnedpasswords.com/range/";

async function checkPasswordBreach(password) {
  if (typeof password !== "string") {
    throw new TypeError("Password must be a string");
  }

  // 1. Hash the password locally using SHA-1.
  const hash = crypto
    .createHash("sha1")
    .update(password, "utf8")
    .digest("hex")
    .toUpperCase();

  // 2. Split the hash into a 5-character prefix
  //    and the remaining suffix.
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  // 3. Send ONLY the prefix to HIBP.
  const response = await fetch(`${HIBP_API_URL}${prefix}`, {
    headers: {
      "Add-Padding": "true",
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`HIBP API request failed with status ${response.status}`);
  }

  // 4. Receive matching suffixes and compare locally.
  const body = await response.text();

  const match = body.split(/\r?\n/).find((line) => {
    const [returnedSuffix] = line.trim().split(":");
    return returnedSuffix?.toUpperCase() === suffix;
  });

  if (!match) {
    return {
      breached: false,
      count: 0,
    };
  }

  const count = Number(match.split(":")[1]);

  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error("Invalid breach count returned by HIBP");
  }

  return {
    breached: true,
    count,
  };
}

module.exports = { checkPasswordBreach };
