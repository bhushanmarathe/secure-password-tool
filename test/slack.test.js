const test = require("node:test");
const assert = require("node:assert/strict");

const { sendPasswordToSlack } = require("../src/slack");

test("sends a password to the configured Slack webhook", async (t) => {
  process.env.SLACK_WEBHOOK_URL =
    "https://hooks.slack.com/services/test/webhook";

  t.mock.method(global, "fetch", async (url, options) => {
    assert.equal(url, process.env.SLACK_WEBHOOK_URL);

    assert.equal(options.method, "POST");
    assert.equal(options.headers["Content-Type"], "application/json");

    const body = JSON.parse(options.body);

    assert.equal(body.text, "Generated password: TestPassword123!");

    return {
      ok: true,
      status: 200,
    };
  });

  const result = await sendPasswordToSlack("TestPassword123!");

  assert.deepEqual(result, { sent: true });
});

test("rejects a missing webhook configuration", async () => {
  const original = process.env.SLACK_WEBHOOK_URL;

  try {
    delete process.env.SLACK_WEBHOOK_URL;

    await assert.rejects(
      sendPasswordToSlack("TestPassword123!"),
      /SLACK_WEBHOOK_URL is not configured/,
    );
  } finally {
    if (original === undefined) {
      delete process.env.SLACK_WEBHOOK_URL;
    } else {
      process.env.SLACK_WEBHOOK_URL = original;
    }
  }
});

test("rejects an invalid webhook URL", async () => {
  const original = process.env.SLACK_WEBHOOK_URL;

  try {
    process.env.SLACK_WEBHOOK_URL = "https://example.com/webhook";

    await assert.rejects(
      sendPasswordToSlack("TestPassword123!"),
      /Invalid Slack webhook URL/,
    );
  } finally {
    if (original === undefined) {
      delete process.env.SLACK_WEBHOOK_URL;
    } else {
      process.env.SLACK_WEBHOOK_URL = original;
    }
  }
});

test("handles Slack delivery failures", async (t) => {
  process.env.SLACK_WEBHOOK_URL =
    "https://hooks.slack.com/services/test/webhook";

  t.mock.method(global, "fetch", async () => ({
    ok: false,
    status: 500,
  }));

  await assert.rejects(
    sendPasswordToSlack("TestPassword123!"),
    /Slack delivery failed with status 500/,
  );
});
