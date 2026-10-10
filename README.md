# Secure Password Strength & Distribution System

A Node.js command-line application for password validation,
breach checking, secure password generation, and Slack delivery.

## Features

- Validates password length and character requirements.
- Checks password exposure using the Have I Been Pwned API.
- Uses k-anonymity: only the first five characters of the
  SHA-1 hash are sent to HIBP.
- Generates cryptographically random passwords.
- Supports configurable length and optional symbol exclusion.
- Sends generated passwords to Slack using Incoming Webhooks.
- Avoids logging passwords and webhook URLs in application errors.
- Includes automated tests and Docker support.

## Requirements

- Node.js 24 or another compatible recent Node.js version
- npm
- Internet access for HIBP and Slack features
- A Slack Incoming Webhook for Slack delivery

## Installation

Clone or download this repository, then run:

    npm install

Create a `.env` file in the project root:

    SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url

Replace the example with your actual Slack Incoming Webhook URL.

Never commit `.env` or expose webhook credentials.

## Usage

### Generate a password

    node src/cli.js generate

### Generate a password of a specified length

    node src/cli.js generate --length 18

### Generate without symbols

    node src/cli.js generate --length 18 --no-symbols

### Send a generated password to Slack

    node src/cli.js generate --length 20 --send-slack

### Check a password

    node src/cli.js check

Enter the password when prompted. The terminal input is hidden.

The checker validates password requirements and then queries HIBP
if the password meets those requirements.

## Run tests

    node --test

The test suite covers password validation, generation, breach
checking, and Slack delivery behavior using mocked API responses.

## Docker

Build the image:

    docker build -t secure-password-tool .

Generate a password:

    docker run --rm secure-password-tool generate --length 20

Send a password to Slack:

    docker run --rm --env-file .env secure-password-tool generate --length 20 --send-slack

The `.env` file is supplied at runtime and is not included in the
Docker image.

## Security considerations

- Never send plaintext passwords to the HIBP API.
- SHA-1 is used only for the HIBP lookup protocol, not password storage.
- Keep Slack webhook URLs in environment variables.
- Do not log passwords, API secrets, or webhook URLs.
- Slack messages may be retained or visible to workspace administrators.
- A password absent from the HIBP response is not guaranteed to be safe.
- Protect your terminal, environment files, and Slack workspace.

## Project structure

    secure-password-tool/
    ├── src/
    │   ├── validator.js
    │   ├── hibp.js
    │   ├── generator.js
    │   ├── slack.js
    │   └── cli.js
    ├── test/
    │   ├── validator.test.js
    │   ├── hibp.test.js
    │   ├── generator.test.js
    │   └── slack.test.js
    ├── .env
    ├── .gitignore
    ├── Dockerfile
    ├── package.json
    ├── package-lock.json
    └── README.md
