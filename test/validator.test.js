const test = require("node:test");
const assert = require("node:assert/strict");

const { validatePassword } = require("../src/validator");

test("accepts a password that meets all requirements", () => {
  const result = validatePassword("StrongPass123!");

  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test("rejects a password that is too short", () => {
  const result = validatePassword("Ab1!");

  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.includes("at least 12")));
});

test("rejects a password without uppercase letters", () => {
  const result = validatePassword("strongpassword123!");

  assert.ok(
    result.errors.includes("Password must contain an uppercase letter"),
  );
});

test("rejects a password without lowercase letters", () => {
  const result = validatePassword("STRONGPASSWORD123!");

  assert.ok(result.errors.includes("Password must contain a lowercase letter"));
});

test("rejects a password without numbers", () => {
  const result = validatePassword("StrongPassword!");

  assert.ok(result.errors.includes("Password must contain a number"));
});

test("rejects a password without special characters", () => {
  const result = validatePassword("StrongPassword123");

  assert.ok(
    result.errors.includes("Password must contain a special character"),
  );
});

test("reports multiple validation errors", () => {
  const result = validatePassword("hello");

  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 1);
});

test("rejects non-string input", () => {
  const result = validatePassword(12345);

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, ["Password must be a string"]);
});
