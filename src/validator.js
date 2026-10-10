const MIN_PASSWORD_LENGTH = 12;

function validatePassword(password) {
  const errors = [];

  if (typeof password !== "string") {
    return {
      valid: false,
      errors: ["Password must be a string"],
    };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    );
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain an uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain a lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain a number");
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must contain a special character");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = { validatePassword };
