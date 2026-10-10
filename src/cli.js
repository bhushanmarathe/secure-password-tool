require("dotenv").config();

const { validatePassword } = require("./validator");
const { checkPasswordBreach } = require("./hibp");
const { generateUnbreachedPassword } = require("./safe-generator");
const { sendPasswordToSlack } = require("./slack");

function parseArgs(args) {
  const options = {
    length: 20,
    noSymbols: false,
    sendSlack: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--length") {
      const value = args[++i];

      if (value === undefined || !/^\d+$/.test(value)) {
        throw new Error("--length requires an integer");
      }

      options.length = Number(value);
    } else if (arg === "--no-symbols") {
      options.noSymbols = true;
    } else if (arg === "--send-slack") {
      options.sendSlack = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

// Read the password without echoing it in the terminal.
function promptHidden(question) {
  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const output = process.stdout;

    if (!input.isTTY || typeof input.setRawMode !== "function") {
      reject(new Error("Run this command in an interactive terminal"));
      return;
    }

    let password = "";

    output.write(question);
    input.setRawMode(true);
    input.resume();
    input.setEncoding("utf8");

    function cleanup() {
      input.removeListener("data", onData);
      input.setRawMode(false);
      input.pause();
      output.write("\n");
    }

    function onData(key) {
      if (key === "\u0003") {
        cleanup();
        reject(new Error("Input cancelled"));
        return;
      }

      if (key === "\r" || key === "\n") {
        cleanup();
        resolve(password);
        return;
      }

      if (key === "\u007f" || key === "\b") {
        password = password.slice(0, -1);
        return;
      }

      if (key >= " " && key !== "\u007f") {
        password += key;
      }
    }

    input.on("data", onData);
  });
}

async function run() {
  const [command, ...args] = process.argv.slice(2);

  if (!["check", "generate"].includes(command)) {
    console.log(
      "Usage:\n" +
        "  node src/cli.js check\n" +
        "  node src/cli.js generate [--length 20] " +
        "[--no-symbols] [--send-slack]",
    );
    process.exitCode = 1;
    return;
  }

  if (command === "check") {
    if (args.length > 0) {
      throw new Error("The check command does not accept options");
    }

    const password = await promptHidden("Enter password: ");

    const result = validatePassword(password);

    if (!result.valid) {
      console.log("Password strength check failed:");
      result.errors.forEach((error) => console.log(`- ${error}`));
    } else {
      console.log("Password meets the character requirements.");
    }

    // Always attempt the breach check, even if strength rules fail.
    try {
      const breach = await checkPasswordBreach(password);

      if (breach.breached) {
        console.log(
          `Warning: Found in breach data (${breach.count} occurrences).`,
        );
      } else {
        console.log("No match found in the HIBP response.");
      }
    } catch {
      console.error(
        "Breach check failed. The password's breach status is unknown.",
      );
      process.exitCode = 1;
    }

    return;
  }

  const options = parseArgs(args);

  let password;

  try {
    password = await generateUnbreachedPassword({
      length: options.length,
      noSymbols: options.noSymbols,
      maxAttempts: 5,
    });
  } catch (error) {
    if (
      error.message?.startsWith("Could not generate an unbreached password")
    ) {
      console.error(error.message);
    } else {
      console.error(
        "Password generation stopped because its breach status " +
          "could not be verified.",
      );
    }

    process.exitCode = 1;
    return;
  }

  if (options.sendSlack) {
    try {
      await sendPasswordToSlack(password);
      console.log("Verified password generated and sent to Slack.");
    } catch {
      console.error("Password delivery to Slack failed.");
      process.exitCode = 1;
    }
  } else {
    console.log(password);
  }
}
