const test = require("node:test");
const assert = require("node:assert/strict");

const { generateUnbreachedPassword } = require("../src/safe-generator");

test("returns a password when HIBP reports no breach", async () => {
  let checks = 0;

  const password = await generateUnbreachedPassword({
    generate: () => "FreshPassword123!",
    checkBreach: async () => {
      checks++;
      return { breached: false, count: 0 };
    },
  });

  assert.equal(password, "FreshPassword123!");
  assert.equal(checks, 1);
});

test("retries when a generated password is breached", async () => {
  let generation = 0;

  const password = await generateUnbreachedPassword({
    generate: () => `Password${++generation}Ab!`,
    checkBreach: async (value) => ({
      breached: value === "Password1Ab!",
      count: value === "Password1Ab!" ? 10 : 0,
    }),
  });

  assert.equal(password, "Password2Ab!");
  assert.equal(generation, 2);
});

test("stops after the maximum number of attempts", async () => {
  let checks = 0;

  await assert.rejects(
    generateUnbreachedPassword({
      maxAttempts: 3,
      generate: () => "BreachedPassword123!",
      checkBreach: async () => {
        checks++;
        return { breached: true, count: 5 };
      },
    }),
    /Could not generate an unbreached password after 3 attempts/,
  );

  assert.equal(checks, 3);
});

test("does not return a password if HIBP fails", async () => {
  await assert.rejects(
    generateUnbreachedPassword({
      generate: () => "Password123!",
      checkBreach: async () => {
        throw new Error("Network failure");
      },
    }),
    /Network failure/,
  );
});

test("rejects an invalid breach-check response", async () => {
  await assert.rejects(
    generateUnbreachedPassword({
      generate: () => "Password123!",
      checkBreach: async () => ({ count: 0 }),
    }),
    /Invalid breach-check response/,
  );
});

test("rejects an invalid retry limit", async () => {
  await assert.rejects(
    generateUnbreachedPassword({ maxAttempts: 0 }),
    /maxAttempts must be a positive integer/,
  );
});
