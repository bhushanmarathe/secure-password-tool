async function sendPasswordToSlack(password) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    throw new Error("SLACK_WEBHOOK_URL is not configured");
  }

  // Accept only HTTPS Slack webhook URLs.
  let parsedUrl;

  try {
    parsedUrl = new URL(webhookUrl);
  } catch {
    throw new Error("Invalid Slack webhook URL");
  }

  if (
    parsedUrl.protocol !== "https:" ||
    parsedUrl.hostname !== "hooks.slack.com"
  ) {
    throw new Error("Invalid Slack webhook URL");
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: `Generated password: ${password}`,
    }),
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Slack delivery failed with status ${response.status}`);
  }

  return { sent: true };
}

module.exports = { sendPasswordToSlack };
