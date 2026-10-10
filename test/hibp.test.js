const test = require("node:test");
const assert = require("node:assert/strict");

const { checkPasswordBreach } = require("../src/hibp");

test("detects a password found in the breach database", async (t) => {
  t.mock.method(global, "fetch", async (url, options) => {
    assert.equal(url, "https://api.pwnedpasswords.com/range/5BAA6");

    assert.equal(options.headers["Add-Padding"], "true");

    return {
      ok: true,
      text: async () => "1E4C9B93F3F0682250B6CF8331B7EE68FD8:100\n",
    };
  });

  const result = await checkPasswordBreach("password");

  assert.deepEqual(result, {
    breached: true,
    count: 100,
  });
});

test("returns not breached when the hash is absent", async (t) => {
  t.mock.method(global, "fetch", async () => ({
    ok: true,
    text: async () => "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:5\n",
  }));

  const result = await checkPasswordBreach("a-unique-test-password");

  assert.deepEqual(result, {
    breached: false,
    count: 0,
  });
});

test("throws when the API returns an error", async (t) => {
  t.mock.method(global, "fetch", async () => ({
    ok: false,
    status: 503,
  }));

  await assert.rejects(
    checkPasswordBreach("test-password"),
    /HIBP API request failed with status 503/,
  );
});

test("rejects non-string passwords", async () => {
  await assert.rejects(checkPasswordBreach(12345), {
    name: "TypeError",
    message: "Password must be a string",
  });
});
