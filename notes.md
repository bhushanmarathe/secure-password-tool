# Secure Password Strength & Distribution System — Notes

## 1. Project Overview

This Node.js command-line application can:

- Check password strength.
- Check whether a password appears in known breach data using the Have I Been Pwned (HIBP) API.
- Generate strong random passwords.
- Send generated passwords to Slack.
- Run automated tests and use Docker for packaging.

The main idea is to keep each responsibility in a separate file, making the application easier to maintain and test.

## 2. Source Files

### `src/validator.js` — Password Strength Checker

**Purpose:** Checks whether a user-provided password follows the password policy.

It checks:

- Minimum length of 12 characters.
- Uppercase letters.
- Lowercase letters.
- Numbers.
- Special characters.

**Main function:** `validatePassword(password)`

**Example:**

```js
validatePassword("hello123");
```

The function returns an object containing `valid: false` and the reasons the password failed.

**Remember:** This file handles local password validation. It doesn't make API calls or generate passwords.

### `src/hibp.js` — Password Breach Checker

**Purpose:** Checks whether a password has appeared in known password breach data.

It:

1. Takes the password as input.
2. Calculates its SHA-1 hash locally.
3. Splits the hash into a five-character prefix and the remaining suffix.
4. Sends only the prefix to the HIBP API.
5. Receives matching hash suffixes.
6. Compares the full hash locally and returns whether a match was found and how many times it appeared.

**Main function:** `checkPasswordBreach(password)`

**Important concept — k-anonymity:** The actual password and its complete hash are not sent to HIBP. Only the first five characters of the hash are sent, helping protect the password's privacy.

**Remember:** This file handles external API communication and breach detection, not password strength validation.

### `src/generator.js` — Secure Password Generator

**Purpose:** Generates random passwords using Node.js's cryptographically secure random functions.

It:

- Generates passwords with a default length of 20 characters.
- Allows a length between 16 and 24 characters.
- Ensures at least one uppercase letter, lowercase letter, and digit.
- Includes at least one special character by default.
- Supports the `noSymbols` option.
- Shuffles characters so required character types aren't always in fixed positions.

**Main function:** `generatePassword(options)`

**Example:**

```js
generatePassword({ length: 18, noSymbols: true });
```

**Important concept:** It uses Node.js `crypto.randomInt()` rather than `Math.random()` to select characters securely.

**Remember:** This file generates passwords. It doesn't check passwords against HIBP or send them to Slack.

### `src/safe-generator.js` — Generate and Verify Passwords

**Purpose:** Combines password generation with the HIBP breach checker.

It:

- Generates a password using `generator.js`.
- Checks the password using `hibp.js`.
- Discards and retries if the password appears in breach data.
- Stops after a maximum of five attempts by default.
- Returns a password only when HIBP reports no match.
- Throws an error if the API fails or all attempts find breached passwords.

**Main function:** `generateUnbreachedPassword(options)`

It also accepts injected generator and breach-check functions, making it easier to write unit tests without real API requests.

**Remember:** This file coordinates password generation and breach checking. It adds a safeguard so a password isn't released when its breach status is unknown.

### `src/slack.js` — Slack Integration

**Purpose:** Sends a generated password to a Slack channel through an Incoming Webhook.

It:

- Reads `SLACK_WEBHOOK_URL` from environment variables.
- Checks that the URL uses HTTPS and the expected Slack webhook hostname.
- Sends a POST request containing the password in the message body.
- Throws an error if the webhook is missing, invalid, or returns a failed response.
- Returns a success result if Slack accepts the message.

**Main function:** `sendPasswordToSlack(password)`

**Example command:**

```bash
node src/cli.js generate --length 20 --send-slack
```

**Security note:** Slack messages can be retained or visible to workspace administrators, so only send passwords to an authorized destination.

**Remember:** This file handles password delivery to Slack. It doesn't generate or validate passwords itself.

### `src/cli.js` — Main Application Entry Point

**Purpose:** Connects all modules and lets users operate the application through terminal commands. This is the main file a user runs.

It:

- Loads environment variables using `dotenv`.
- Parses command-line arguments.
- Supports the `check` and `generate` commands.
- Reads passwords without displaying the characters while typing.
- Calls the validator and HIBP checker for password checks.
- Calls `safe-generator.js` to generate and verify passwords.
- Calls `slack.js` when `--send-slack` is specified.
- Handles errors without intentionally printing passwords or webhook URLs.

| Function                 | Responsibility                                                        |
| ------------------------ | --------------------------------------------------------------------- |
| `parseArgs(args)`        | Reads options such as `--length`, `--no-symbols`, and `--send-slack`. |
| `promptHidden(question)` | Accepts password input without echoing it to the terminal.            |
| `run()`                  | Coordinates the selected command and calls the appropriate modules.   |

**Example commands:**

```bash
node src/cli.js check
node src/cli.js generate
node src/cli.js generate --length 18
node src/cli.js generate --length 18 --no-symbols
node src/cli.js generate --length 20 --send-slack
```

**Remember:** This file is the controller of the application. It connects modules and determines what happens based on the user's command.

**Debugging note:** `safe-generator.js` was added recently, and its live CLI generation behavior was not displaying output during the last debugging session. The automated tests passed, but that behavior still needs verification.

## 3. Test Files

The `test/` folder contains automated tests. These tests check the application's behavior without requiring you to manually try every scenario.

### `test/validator.test.js`

**Purpose:** Tests password strength validation.

It checks:

- Valid passwords are accepted.
- Short passwords are rejected.
- Missing uppercase letters, lowercase letters, numbers, and symbols are detected.
- Multiple errors can be returned together.
- Non-string input is rejected.

**Tests:** `validator.js`

### `test/hibp.test.js`

**Purpose:** Tests HIBP breach-checking functionality.

It checks:

- A password matching the mocked breach response is detected.
- A password absent from the response is reported as not found.
- API failures are handled.
- Non-string input is rejected.

**Important:** These tests mock the API response; they don't prove that a live HIBP request always works.

**Tests:** `hibp.js`

### `test/generator.test.js`

**Purpose:** Tests password generation.

It checks:

- The default password length.
- Custom lengths within the allowed range.
- Required character types.
- Generation without symbols.
- Invalid lengths and non-integer lengths.

**Tests:** `generator.js`

### `test/slack.test.js`

**Purpose:** Tests Slack message delivery without sending real messages.

It checks:

- Successful webhook delivery.
- Missing webhook configuration.
- Invalid webhook URLs.
- Slack delivery failures.

The tests mock `fetch`, allowing them to run without contacting Slack.

**Tests:** `slack.js`

### `test/safe-generator.test.js`

**Purpose:** Tests generating a password and checking it against HIBP before releasing it.

It checks:

- An unbreached password is returned.
- A breached password triggers a retry.
- The retry limit is respected.
- HIBP failures stop the process.
- Invalid API responses are rejected.
- Invalid retry limits are rejected.

**Tests:** `safe-generator.js` and its retry behavior.

## 4. Configuration and Project Files

### `.env` — Environment Variables

**Purpose:** Stores configuration values and secrets outside the source code.

**Example:**

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

The application reads this value using `dotenv`.

**Remember:** Never commit the real `.env` file to Git.

### `.gitignore` — Files Git Should Ignore

**Purpose:** Prevents sensitive or unnecessary files from being included in Git commits.

Typical entries include:

```gitignore
node_modules/
.env
coverage/
```

- `node_modules/` — installed dependencies.
- `.env` — secrets and local configuration.
- `coverage/` — generated test coverage reports.

### `package.json` — Project Configuration

**Purpose:** Defines the Node.js project's metadata, dependencies, and scripts.

It contains information such as:

- Project name and version.
- Installed packages, such as `dotenv`.
- The `npm test` command.
- Other project scripts and configuration.

**Example:**

```json
{
  "scripts": {
    "test": "node --test"
  }
}
```

Run the tests with:

```bash
npm test
```

### `package-lock.json` — Dependency Lock File

**Purpose:** Records the exact dependency versions and dependency tree installed by npm.

This helps developers install consistent dependency versions across different machines and environments.

**Remember:** Commit this file to Git to support reproducible installs.

### `Dockerfile` — Container Configuration

**Purpose:** Defines how to package the application into a Docker image.

The Dockerfile:

- Uses Node.js 24 Alpine as the base image.
- Sets `/app` as the working directory.
- Installs production dependencies.
- Copies source files into the image.
- Runs the application as a non-root user.
- Configures the CLI as the container's entry point.

**Example commands:**

```bash
docker build -t secure-password-tool .
docker run --rm secure-password-tool generate --length 20
```

**Remember:** Docker allows the application to run in a consistent, isolated environment without requiring the user to configure Node.js directly on the host machine.

### `README.md` — Project Documentation

**Purpose:** Explains the project to someone who wants to install, use, test, or review it.

It documents:

- Project features.
- Installation requirements.
- Environment configuration.
- CLI commands.
- Running tests.
- Docker usage.
- Security considerations.
- Project structure.

## 5. How All the Files Work Together

```text
cli.js
Receives the user's command

├── Check command
│   ├── validator.js
│   └── hibp.js
│
└── Generate command
    ├── generator.js
    └── safe-generator.js
        └── hibp.js
            └── Checks whether the generated password appears in breach data

slack.js
Sends the verified password if Slack delivery is requested
```

Supporting files:

- `test/` verifies the modules' behavior.
- `.env` stores local configuration and secrets.
- `.gitignore` excludes sensitive and generated files.
- `package.json` and `package-lock.json` manage dependencies and scripts.
- `Dockerfile` packages the application.
- `README.md` documents how to use it.

## 6. Quick Revision Table

| File                     | One-line purpose                                               |
| ------------------------ | -------------------------------------------------------------- |
| `validator.js`           | Checks password strength rules.                                |
| `hibp.js`                | Checks password hashes against HIBP breach data.               |
| `generator.js`           | Creates cryptographically random passwords.                    |
| `safe-generator.js`      | Generates passwords and retries if they appear in breach data. |
| `slack.js`               | Sends generated passwords to Slack.                            |
| `cli.js`                 | Connects modules and handles terminal commands.                |
| `validator.test.js`      | Tests password validation.                                     |
| `hibp.test.js`           | Tests breach-checking behavior.                                |
| `generator.test.js`      | Tests password generation.                                     |
| `slack.test.js`          | Tests Slack delivery behavior.                                 |
| `safe-generator.test.js` | Tests retries and fail-safe behavior.                          |
| `.env`                   | Stores local configuration and secrets.                        |
| `.gitignore`             | Excludes files from Git.                                       |
| `package.json`           | Defines dependencies and scripts.                              |
| `package-lock.json`      | Locks dependency versions.                                     |
| `Dockerfile`             | Defines the Docker image.                                      |
| `README.md`              | Documents setup and usage.                                     |

## Main Takeaway

`cli.js` coordinates the application, each file in `src/` has a specific responsibility, and the test files verify that those responsibilities work as expected.
