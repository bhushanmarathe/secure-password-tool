const test = require("node:test");
const assert = require("node:assert/strict");

const { generatePassword } = require("../src/generator");

test("generates a password of the default length", () => {
  const password = generatePassword();

  assert.equal(password.length, 20);
});

test("generates passwords within the allowed length range", () => {
  for (const length of [16, 18, 24]) {
    const password = generatePassword({ length });

    assert.equal(password.length, length);
  }
});

test("includes all four required character types", () => {
  const password = generatePassword();

  assert.match(password, /[A-Z]/);
  assert.match(password, /[a-z]/);
  assert.match(password, /[0-9]/);
  assert.match(password, /[^A-Za-z0-9]/);
});

test("generates passwords without symbols when requested", () => {
  const password = generatePassword({
    length: 18,
    noSymbols: true,
  });

  assert.equal(password.length, 18);
  assert.match(password, /[A-Z]/);
  assert.match(password, /[a-z]/);
  assert.match(password, /[0-9]/);
  assert.doesNotMatch(password, /[^A-Za-z0-9]/);
});

test("rejects lengths outside 16–24", () => {
  for (const length of [0, 15, 25, 30]) {
    assert.throws(
      () => generatePassword({ length }),
      /Password length must be between 16 and 24/,
    );
  }
});

test("rejects non-integer lengths", () => {
  assert.throws(
    () => generatePassword({ length: 18.5 }),
    /Password length must be between 16 and 24/,
  );
});
